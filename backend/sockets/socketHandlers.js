import { pool } from "../config/database.js";
import { ROLES } from "../constants/plans.js";

// Handle socket connection
export const handleSocketConnection = (io, socket) => {
  console.log(`🔌 User connected: ${socket.user.email} (${socket.user.role})`);

  // Send welcome message
  socket.emit("connected", {
    message: "Connected to MenuSnap real-time service",
    user: {
      id: socket.user.id,
      email: socket.user.email,
      role: socket.user.role,
    },
    timestamp: new Date().toISOString(),
  });

  // Handle join room
  socket.on("join:room", (data) => {
    const { room } = data;

    // Validate room access based on user role
    if (canJoinRoom(socket.user.role, room)) {
      socket.join(room);
      socket.emit("room:joined", { room });
      console.log(`👥 ${socket.user.email} joined room: ${room}`);
    } else {
      socket.emit("error", { message: "Access denied to room" });
    }
  });

  // Handle leave room
  socket.on("leave:room", (data) => {
    const { room } = data;
    socket.leave(room);
    socket.emit("room:left", { room });
    console.log(`👋 ${socket.user.email} left room: ${room}`);
  });

  // Handle notification acknowledgment
  socket.on("notification:ack", async (data) => {
    try {
      const { notificationId } = data;

      // Mark notification as read
      await pool.query(
        `
        UPDATE notifications 
        SET is_read = true 
        WHERE id = $1 AND user_id = $2
      `,
        [notificationId, socket.user.id]
      );

      socket.emit("notification:ack:success", { notificationId });
    } catch (error) {
      console.error("Error acknowledging notification:", error);
      socket.emit("error", { message: "Failed to acknowledge notification" });
    }
  });

  // Handle typing indicators (for support chat)
  socket.on("typing:start", (data) => {
    const { room } = data;
    socket.to(room).emit("typing:start", {
      userId: socket.user.id,
      userName:
        `${socket.user.first_name} ${socket.user.last_name}`.trim() ||
        socket.user.email,
    });
  });

  socket.on("typing:stop", (data) => {
    const { room } = data;
    socket.to(room).emit("typing:stop", {
      userId: socket.user.id,
    });
  });

  // Handle support messages
  socket.on("support:message", async (data) => {
    try {
      const { ticketId, message, isInternal = false } = data;

      // Validate ticket access
      const ticketResult = await pool.query(
        `
        SELECT st.*, u.email as user_email, u.role as user_role
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        WHERE st.id = $1 AND (st.user_id = $2 OR $3 = 'ADMIN' OR $3 = 'MOD')
      `,
        [ticketId, socket.user.id, socket.user.role]
      );

      if (ticketResult.rows.length === 0) {
        socket.emit("error", { message: "Ticket not found or access denied" });
        return;
      }

      const ticket = ticketResult.rows[0];

      // Insert message
      const messageResult = await pool.query(
        `
        INSERT INTO support_messages (ticket_id, user_id, message, is_internal)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
        [ticketId, socket.user.id, message, isInternal]
      );

      const newMessage = messageResult.rows[0];

      // Emit to ticket participants
      const messageData = {
        id: newMessage.id,
        ticketId: newMessage.ticket_id,
        userId: newMessage.user_id,
        userName:
          `${socket.user.first_name} ${socket.user.last_name}`.trim() ||
          socket.user.email,
        message: newMessage.message,
        isInternal: newMessage.is_internal,
        createdAt: newMessage.created_at,
      };

      // Send to ticket owner (if not internal message)
      if (!isInternal) {
        io.to(`user:${ticket.user_id}`).emit("support:message", messageData);
      }

      // Send to admins and mods
      io.to("admin").emit("support:message", messageData);

      // Update ticket status if needed
      if (ticket.status === "OPEN") {
        await pool.query(
          `
          UPDATE support_tickets 
          SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
          [ticketId]
        );

        io.to(`user:${ticket.user_id}`).emit("ticket:status:updated", {
          ticketId,
          status: "IN_PROGRESS",
        });
      }
    } catch (error) {
      console.error("Error handling support message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle admin broadcast
  socket.on("admin:broadcast", async (data) => {
    if (socket.user.role !== ROLES.ADMIN) {
      socket.emit("error", { message: "Only admins can broadcast" });
      return;
    }

    try {
      const { title, message, targetRole } = data;

      // Create notifications for target users
      let targetUsers = [];
      if (targetRole) {
        const result = await pool.query(
          "SELECT id FROM users WHERE role = $1 AND is_active = true",
          [targetRole]
        );
        targetUsers = result.rows;
      } else {
        const result = await pool.query(
          "SELECT id FROM users WHERE is_active = true"
        );
        targetUsers = result.rows;
      }

      // Insert notifications and emit real-time events
      for (const user of targetUsers) {
        const notificationResult = await pool.query(
          `
          INSERT INTO notifications (user_id, title, message, type)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
          [user.id, title, message, "system"]
        );

        const notification = notificationResult.rows[0];

        // Emit to user
        io.to(`user:${user.id}`).emit("notification:new", {
          type: "notification:new",
          data: notification,
        });
      }

      socket.emit("broadcast:success", {
        message: "Broadcast sent successfully",
        targetCount: targetUsers.length,
      });
    } catch (error) {
      console.error("Error handling admin broadcast:", error);
      socket.emit("error", { message: "Failed to send broadcast" });
    }
  });

  // Handle ping/pong for connection health
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date().toISOString() });
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(
      `🔌 User disconnected: ${socket.user.email} - Reason: ${reason}`
    );
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error(`🔌 Socket error for user ${socket.user.email}:`, error);
  });

  // Order-related events
  socket.on("join_order_updates", (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(
      `User ${socket.user.email} joined order updates for ${orderId}`
    );
  });

  socket.on("leave_order_updates", (orderId) => {
    socket.leave(`order:${orderId}`);
    console.log(`User ${socket.user.email} left order updates for ${orderId}`);
  });

  socket.on("join_cafe_orders", (cafeId) => {
    if (socket.user.role === "CAFE_OWNER" || socket.user.role === "ADMIN") {
      socket.join(`cafe_orders:${cafeId}`);
      console.log(
        `Cafe owner ${socket.user.email} joined cafe orders for ${cafeId}`
      );
    }
  });

  socket.on("leave_cafe_orders", (cafeId) => {
    socket.leave(`cafe_orders:${cafeId}`);
    console.log(`User ${socket.user.email} left cafe orders for ${cafeId}`);
  });

  // Queue-related events for customers to watch queue updates
  socket.on("join_queue_updates", (cafeId) => {
    socket.join(`queue:${cafeId}`);
    console.log(
      `User ${socket.user.email} joined queue updates for cafe ${cafeId}`
    );
  });

  socket.on("leave_queue_updates", (cafeId) => {
    socket.leave(`queue:${cafeId}`);
    console.log(
      `User ${socket.user.email} left queue updates for cafe ${cafeId}`
    );
  });
};

// Helper function to check if user can join a room
function canJoinRoom(userRole, room) {
  const roomPermissions = {
    admin: [ROLES.ADMIN],
    cafe_owners: [ROLES.CAFE_OWNER, ROLES.ADMIN],
    support: [ROLES.ADMIN, ROLES.MOD],
    developers: [ROLES.ADMIN, ROLES.DEV],
  };

  // Allow users to join their own rooms
  if (room.startsWith("user:") || room.startsWith("cafe:")) {
    return true;
  }

  // Check role-based room permissions
  const allowedRoles = roomPermissions[room];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
}

// Utility functions for emitting events from controllers
export const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

export const emitToRole = (io, role, event, data) => {
  io.to(`role:${role}`).emit(event, data);
};

export const emitToAdmins = (io, event, data) => {
  io.to("admin").emit(event, data);
};

export const emitToCafeOwners = (io, event, data) => {
  io.to("cafe_owners").emit(event, data);
};

export const emitToCafe = (io, cafeId, event, data) => {
  io.to(`cafe:${cafeId}`).emit(event, data);
};

export const broadcastToAll = (io, event, data) => {
  io.emit(event, data);
};

// Order-specific event emitters
export const emitOrderUpdate = (io, orderId, cafeId, orderData) => {
  // Emit to customer
  if (orderData.customer_id) {
    io.to(`user:${orderData.customer_id}`).emit("order:updated", {
      orderId,
      order: orderData,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit to cafe orders room
  io.to(`cafe_orders:${cafeId}`).emit("order:updated", {
    cafeId,
    orderId,
    order: orderData,
    timestamp: new Date().toISOString(),
  });
};

export const emitQueueUpdate = (io, cafeId, queueData) => {
  // Emit to public queue watchers
  io.to(`queue:${cafeId}`).emit("queue:updated", {
    cafeId,
    queue: queueData,
    timestamp: new Date().toISOString(),
  });

  // Emit to cafe orders room
  io.to(`cafe_orders:${cafeId}`).emit("queue:updated", {
    cafeId,
    queue: queueData,
    timestamp: new Date().toISOString(),
  });
};

export const emitNewOrder = (io, cafeId, orderData) => {
  // Emit to cafe orders room
  io.to(`cafe_orders:${cafeId}`).emit("order:new", {
    cafeId,
    order: orderData,
    timestamp: new Date().toISOString(),
  });
};
