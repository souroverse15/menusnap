import { supabase, supabaseAdmin } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Create a new support ticket
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, description, priority = "MEDIUM" } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!subject || !description) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "Subject and description are required",
    });
  }

  // Create the ticket (using admin client to bypass RLS)
  const { data: ticket, error } = await supabaseAdmin
    .from("support_tickets")
    .insert({
      user_id: userId,
      subject,
      status: "OPEN",
      priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating support ticket:", error);
    return res.status(500).json({
      error: "Failed to create ticket",
      message: error.message,
    });
  }

  // Create the initial message with the description (using admin client)
  const { error: messageError } = await supabaseAdmin
    .from("ticket_messages")
    .insert({
      ticket_id: ticket.id,
      user_id: userId,
      message: description,
      is_internal: false,
      created_at: new Date().toISOString(),
    });

  if (messageError) {
    console.error("Error creating initial message:", messageError);
  }

  res.status(201).json({
    success: true,
    data: { ticket },
  });
});

// Get tickets for the current user (with role-based filtering)
export const getTickets = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 20 } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Build query based on user role
  let query = supabase.from("support_tickets").select("*");

  // Role-based filtering
  if (userRole === "ADMIN" || userRole === "DEV" || userRole === "MOD") {
    // Staff can see all tickets
  } else if (userRole === "CAFE_OWNER") {
    // Cafe owners can see their own tickets
    query = query.eq("user_id", userId);
  } else {
    // Regular users can only see their own tickets
    query = query.eq("user_id", userId);
  }

  // Apply filters
  if (status) {
    query = query.eq("status", status);
  }
  if (priority) {
    query = query.eq("priority", priority);
  }

  // Get total count
  const { count, error: countError } = await supabase
    .from("support_tickets")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw countError;
  }

  // Get tickets with pagination
  const { data: tickets, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (error) {
    throw error;
  }

  // Get user information separately
  const userIds = [...new Set((tickets || []).map((t) => t.user_id))];
  let usersData = {};

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .in("id", userIds);

    users?.forEach((user) => {
      usersData[user.id] = user;
    });
  }

  // Get message counts separately
  const ticketIds = (tickets || []).map((t) => t.id);
  let messageCounts = {};

  if (ticketIds.length > 0) {
    const { data: messageCountData } = await supabase
      .from("ticket_messages")
      .select("ticket_id")
      .in("ticket_id", ticketIds);

    messageCountData?.forEach((msg) => {
      messageCounts[msg.ticket_id] = (messageCounts[msg.ticket_id] || 0) + 1;
    });
  }

  // Transform data to include user information
  const transformedTickets = (tickets || []).map((ticket) => ({
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    author: usersData[ticket.user_id]
      ? {
          email: usersData[ticket.user_id].email,
          name:
            `${usersData[ticket.user_id].first_name || ""} ${
              usersData[ticket.user_id].last_name || ""
            }`.trim() || usersData[ticket.user_id].email,
        }
      : null,
    messageCount: messageCounts[ticket.id] || 0,
    lastActivity: ticket.updated_at,
    createdAt: ticket.created_at,
  }));

  res.json({
    success: true,
    data: {
      tickets: transformedTickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalCount: count || 0,
        hasNext: parseInt(page) * parseInt(limit) < (count || 0),
        hasPrev: parseInt(page) > 1,
      },
    },
  });
});

// Get a specific ticket with messages
export const getTicketById = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Get the ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (ticketError) {
    return res.status(404).json({
      error: "Ticket not found",
      message: ticketError.message,
    });
  }

  // Check permissions
  const isStaff = ["ADMIN", "DEV", "MOD"].includes(userRole);
  const isOwner = ticket.user_id === userId;

  if (!isStaff && !isOwner) {
    return res.status(403).json({
      error: "Access denied",
      message: "You don't have permission to view this ticket",
    });
  }

  // Get ticket author
  const { data: ticketAuthor } = await supabase
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("id", ticket.user_id)
    .single();

  // Get messages
  const { data: messages, error: messagesError } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
  }

  // Get message senders
  const messageUserIds = [...new Set((messages || []).map((m) => m.user_id))];
  let messageUsers = {};

  if (messageUserIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role")
      .in("id", messageUserIds);

    users?.forEach((user) => {
      messageUsers[user.id] = user;
    });
  }

  // Transform messages
  const transformedMessages = (messages || []).map((msg) => ({
    id: msg.id,
    message: msg.message,
    isInternal: msg.is_internal,
    createdAt: msg.created_at,
    sender: messageUsers[msg.user_id]
      ? {
          email: messageUsers[msg.user_id].email,
          name:
            `${messageUsers[msg.user_id].first_name || ""} ${
              messageUsers[msg.user_id].last_name || ""
            }`.trim() || messageUsers[msg.user_id].email,
          role: messageUsers[msg.user_id].role,
          isStaff: ["ADMIN", "DEV", "MOD"].includes(
            messageUsers[msg.user_id].role
          ),
        }
      : null,
  }));

  res.json({
    success: true,
    data: {
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        author: ticketAuthor
          ? {
              email: ticketAuthor.email,
              name:
                `${ticketAuthor.first_name || ""} ${
                  ticketAuthor.last_name || ""
                }`.trim() || ticketAuthor.email,
            }
          : null,
      },
      messages: transformedMessages,
    },
  });
});

// Add a message to a ticket
export const addMessage = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { message, isInternal = false } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!message || !message.trim()) {
    return res.status(400).json({
      error: "Message is required",
    });
  }

  // Check if ticket exists and user has permission
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("user_id, status")
    .eq("id", ticketId)
    .single();

  if (ticketError) {
    return res.status(404).json({
      error: "Ticket not found",
    });
  }

  const isStaff = ["ADMIN", "DEV", "MOD"].includes(userRole);
  const isOwner = ticket.user_id === userId;

  if (!isStaff && !isOwner) {
    return res.status(403).json({
      error: "Access denied",
    });
  }

  // Only staff can add internal messages
  if (isInternal && !isStaff) {
    return res.status(403).json({
      error: "Only staff can add internal messages",
    });
  }

  // Add the message (using admin client)
  const { data: newMessage, error: messageError } = await supabaseAdmin
    .from("ticket_messages")
    .insert({
      ticket_id: ticketId,
      user_id: userId,
      message: message.trim(),
      is_internal: isInternal,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (messageError) {
    throw messageError;
  }

  // Update ticket's updated_at timestamp (using admin client)
  await supabaseAdmin
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  res.status(201).json({
    success: true,
    data: { message: newMessage },
  });
});

// Update ticket status (staff only)
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { status, assignedTo } = req.body;
  const userRole = req.user.role;

  // Only staff can update ticket status
  if (!["ADMIN", "DEV", "MOD"].includes(userRole)) {
    return res.status(403).json({
      error: "Access denied",
      message: "Only staff can update ticket status",
    });
  }

  // Validate status
  const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid status",
      message: `Status must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const updateData = {
    updated_at: new Date().toISOString(),
  };

  if (status) {
    updateData.status = status;
  }
  if (assignedTo) {
    updateData.assigned_to = assignedTo;
  }

  const { data: ticket, error } = await supabaseAdmin
    .from("support_tickets")
    .update(updateData)
    .eq("id", ticketId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data: { ticket },
  });
});

// Get support statistics (admin only)
export const getSupportStats = asyncHandler(async (req, res) => {
  const userRole = req.user.role;

  if (!["ADMIN", "DEV"].includes(userRole)) {
    return res.status(403).json({
      error: "Access denied",
    });
  }

  // Get ticket counts by status
  const { data: statusCounts } = await supabase
    .from("support_tickets")
    .select("status")
    .then(({ data }) => {
      const counts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
      data?.forEach((ticket) => {
        counts[ticket.status] = (counts[ticket.status] || 0) + 1;
      });
      return { data: counts };
    });

  // Get ticket counts by priority
  const { data: priorityCounts } = await supabase
    .from("support_tickets")
    .select("priority")
    .then(({ data }) => {
      const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
      data?.forEach((ticket) => {
        counts[ticket.priority] = (counts[ticket.priority] || 0) + 1;
      });
      return { data: counts };
    });

  res.json({
    success: true,
    data: {
      statusCounts,
      priorityCounts,
      totalTickets: Object.values(statusCounts || {}).reduce(
        (a, b) => a + b,
        0
      ),
    },
  });
});
