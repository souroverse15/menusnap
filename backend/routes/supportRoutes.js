import express from "express";
import {
  createTicket,
  getTickets,
  getTicketById,
  addMessage,
  updateTicketStatus,
  getSupportStats,
} from "../controllers/supportController.js";
import {
  requireAuthentication,
  syncUser,
  validateRequest,
} from "../middleware/authMiddleware.js";
import Joi from "joi";

const router = express.Router();

// Validation schemas
const createTicketSchema = {
  body: Joi.object({
    subject: Joi.string().min(5).max(255).required(),
    description: Joi.string().min(10).max(2000).required(),
    priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT").optional(),
  }),
};

const addMessageSchema = {
  body: Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    isInternal: Joi.boolean().optional(),
  }),
};

const updateStatusSchema = {
  body: Joi.object({
    status: Joi.string().valid("OPEN", "IN_PROGRESS", "RESOLVED").optional(),
    assignedTo: Joi.string().optional(),
  }),
};

// Apply auth middleware to all routes
router.use(requireAuthentication);
router.use(syncUser);

// Routes
router.post("/tickets", validateRequest(createTicketSchema.body), createTicket);
router.get("/tickets", getTickets);
router.get("/tickets/:ticketId", getTicketById);
router.post(
  "/tickets/:ticketId/messages",
  validateRequest(addMessageSchema.body),
  addMessage
);
router.put(
  "/tickets/:ticketId/status",
  validateRequest(updateStatusSchema.body),
  updateTicketStatus
);
router.get("/stats", getSupportStats);

export default router;
