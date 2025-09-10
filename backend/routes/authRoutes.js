import express from "express";
import Joi from "joi";
import AuthController from "../controllers/authController.js";
import {
  requireAuthentication,
  syncUser,
  validateRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  profileImageUrl: Joi.string().uri().optional(),
});

// Test route without middleware
router.get("/test", (req, res) => {
  res.json({ message: "Auth route is working!", auth: !!req.auth });
});

// Test route with just auth check
router.get("/me-test", (req, res) => {
  try {
    const auth = req.auth();
    res.json({
      message: "Auth check working!",
      hasAuth: !!auth,
      userId: auth?.userId || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get(
  "/me",
  requireAuthentication,
  syncUser,
  AuthController.getCurrentUser
);
router.put(
  "/me",
  requireAuthentication,
  syncUser,
  validateRequest(updateProfileSchema),
  AuthController.updateProfile
);
router.get(
  "/permissions",
  requireAuthentication,
  syncUser,
  AuthController.checkPermissions
);

// Get user role and status (helpful for debugging)
router.get("/status", requireAuthentication, syncUser, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        isActive: req.user.is_active,
      },
    },
  });
});
router.post("/webhook", AuthController.handleWebhook);

export default router;
