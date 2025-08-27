import express from "express";
import Joi from "joi";
import AdminController from "../controllers/adminController.js";
import {
  requireAuthentication,
  syncUser,
  requireAdmin,
  validateRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Validation schemas
const approveApplicationSchema = Joi.object({
  adminNotes: Joi.string().max(1000).optional(),
});

const rejectApplicationSchema = Joi.object({
  adminNotes: Joi.string().max(1000).required(),
});

const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid("ADMIN", "CAFE_OWNER", "USER", "PENDING_CAFE", "DEV", "MOD")
    .required(),
});

const toggleUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

// All admin routes require admin role
router.use(requireAuthentication, syncUser, requireAdmin);

// Dashboard and overview
router.get("/dashboard", AdminController.getDashboard);

// Application management
router.get("/applications", AdminController.getApplications);
router.get("/applications/:applicationId", AdminController.getApplication);
router.post(
  "/applications/:applicationId/approve",
  validateRequest(approveApplicationSchema),
  AdminController.approveApplication
);
router.post(
  "/applications/:applicationId/reject",
  validateRequest(rejectApplicationSchema),
  AdminController.rejectApplication
);

// User management
router.get("/users", AdminController.getUsers);
router.put(
  "/users/:userId/role",
  validateRequest(updateUserRoleSchema),
  AdminController.updateUserRole
);
router.put(
  "/users/:userId/status",
  validateRequest(toggleUserStatusSchema),
  AdminController.toggleUserStatus
);
router.delete("/users/:userId", AdminController.deleteUser);

// Notifications
router.get("/notifications", AdminController.getNotifications);
router.put(
  "/notifications/:notificationId/read",
  AdminController.markNotificationRead
);

export default router;
