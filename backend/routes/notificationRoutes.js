import express from "express";
import Joi from "joi";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  requireAuthentication,
  syncUser,
  validateRequest,
} from "../middleware/authMiddleware.js";
import { pool } from "../config/database.js";

const router = express.Router();

// Validation schemas
const createNotificationSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  message: Joi.string().min(1).max(1000).required(),
  type: Joi.string()
    .valid(
      "application:new",
      "application:approved",
      "application:rejected",
      "notification:new",
      "support:message",
      "system"
    )
    .default("notification:new"),
  data: Joi.object().optional(),
});

// All notification routes require authentication
router.use(requireAuthentication, syncUser);

// Get user notifications
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE user_id = $1";
    const values = [userId];
    let paramCount = 2;

    if (type) {
      whereClause += ` AND type = $${paramCount}`;
      values.push(type);
      paramCount++;
    }

    if (isRead !== undefined) {
      whereClause += ` AND is_read = $${paramCount}`;
      values.push(isRead === "true");
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM notifications ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get notifications
    values.push(limit, offset);
    const query = `
    SELECT * FROM notifications 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      },
    });
  })
);

// Get unread notification count
router.get(
  "/unread-count",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
      [userId]
    );

    res.json({
      success: true,
      data: {
        unreadCount: parseInt(result.rows[0].count),
      },
    });
  })
);

// Mark notification as read
router.put(
  "/:notificationId/read",
  asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `
    UPDATE notifications 
    SET is_read = true 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      data: {
        notification: result.rows[0],
      },
    });
  })
);

// Mark all notifications as read
router.put(
  "/mark-all-read",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await pool.query(
      `
    UPDATE notifications 
    SET is_read = true 
    WHERE user_id = $1 AND is_read = false
    RETURNING COUNT(*)
  `,
      [userId]
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      data: {
        updatedCount: result.rowCount,
      },
    });
  })
);

// Delete notification
router.delete(
  "/:notificationId",
  asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `
    DELETE FROM notifications 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  })
);

// Create notification (admin only)
router.post(
  "/",
  validateRequest(createNotificationSchema),
  asyncHandler(async (req, res) => {
    // Only admins can create notifications
    if (req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admins can create notifications" });
    }

    const { title, message, type, data } = req.validatedBody;
    const { targetUserId, targetRole } = req.query;

    let notifications = [];

    if (targetUserId) {
      // Send to specific user
      const result = await pool.query(
        `
      INSERT INTO notifications (user_id, title, message, type, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
        [targetUserId, title, message, type, JSON.stringify(data)]
      );

      notifications = result.rows;
    } else if (targetRole) {
      // Send to all users with specific role
      const users = await pool.query("SELECT id FROM users WHERE role = $1", [
        targetRole,
      ]);

      for (const user of users.rows) {
        const result = await pool.query(
          `
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
          [user.id, title, message, type, JSON.stringify(data)]
        );

        notifications.push(result.rows[0]);
      }
    } else {
      // Broadcast to all users
      const users = await pool.query(
        "SELECT id FROM users WHERE is_active = true"
      );

      for (const user of users.rows) {
        const result = await pool.query(
          `
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
          [user.id, title, message, type, JSON.stringify(data)]
        );

        notifications.push(result.rows[0]);
      }
    }

    res.status(201).json({
      success: true,
      message: "Notification(s) created successfully",
      data: {
        notifications,
        count: notifications.length,
      },
    });
  })
);

export default router;
