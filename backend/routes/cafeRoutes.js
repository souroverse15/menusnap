import express from "express";
import Joi from "joi";
import CafeController from "../controllers/cafeController.js";
import {
  requireAuthentication,
  syncUser,
  requireCafeOwner,
  requireCafeOwnership,
  validateRequest,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Validation schemas
const cafeApplicationSchema = Joi.object({
  cafeName: Joi.string().min(2).max(255).required(),
  cafeDescription: Joi.string().max(1000).allow("").optional(),
  logoUrl: Joi.string().uri().allow("").optional(),
  address: Joi.string().min(5).max(500).required(),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).optional(),
  postalCode: Joi.string().min(3).max(20).required(),
  country: Joi.string().min(2).max(100).default("Bangladesh"),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  websiteUrl: Joi.string().uri().allow("").optional(),
  socialLinks: Joi.object({
    facebook: Joi.string().uri().allow("").optional(),
    instagram: Joi.string().uri().allow("").optional(),
    twitter: Joi.string().uri().allow("").optional(),
  }).optional(),
  businessLicense: Joi.string().max(255).allow("").optional(),
  planType: Joi.string().valid("FREE", "PLUS", "PRO").required(),
  paymentDetails: Joi.object({
    cardNumber: Joi.string().optional(), // Placeholder - will be encrypted
    expiryMonth: Joi.number().min(1).max(12).optional(),
    expiryYear: Joi.number().min(new Date().getFullYear()).optional(),
    cvv: Joi.string().optional(),
    billingAddress: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      country: Joi.string().optional(),
    }).optional(),
  }).optional(),
});

const updateApplicationSchema = Joi.object({
  cafeName: Joi.string().min(2).max(255).optional(),
  cafeDescription: Joi.string().max(1000).allow("").optional(),
  logoUrl: Joi.string().uri().allow("").optional(),
  address: Joi.string().min(5).max(500).optional(),
  city: Joi.string().min(2).max(100).optional(),
  state: Joi.string().min(2).max(100).optional(),
  postalCode: Joi.string().min(3).max(20).optional(),
  country: Joi.string().min(2).max(100).default("Bangladesh").optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  websiteUrl: Joi.string().uri().allow("").optional(),
  socialLinks: Joi.object({
    facebook: Joi.string().uri().allow("").optional(),
    instagram: Joi.string().uri().allow("").optional(),
    twitter: Joi.string().uri().allow("").optional(),
  }).optional(),
  businessLicense: Joi.string().max(255).allow("").optional(),
  planType: Joi.string().valid("FREE", "PLUS", "PRO").optional(),
  paymentDetails: Joi.object().optional(),
});

const updateCafeSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  address: Joi.string().min(5).max(500).optional(),
  city: Joi.string().min(2).max(100).optional(),
  state: Joi.string().min(2).max(100).optional(),
  postal_code: Joi.string().min(3).max(20).optional(),
  country: Joi.string().min(2).max(100).default("Bangladesh").optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  website_url: Joi.string().uri().allow("").optional(),
  logo_url: Joi.string().uri().allow("").optional(),
  cover_image_url: Joi.string().uri().allow("").optional(),
  business_hours: Joi.object({
    monday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false),
    }).optional(),
    tuesday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false),
    }).optional(),
    wednesday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false),
    }).optional(),
    thursday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false),
    }).optional(),
    friday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false),
    }).optional(),
    saturday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false),
    }).optional(),
    sunday: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      closed: Joi.boolean().default(false),
    }).optional(),
  }).optional(),
});

// Routes
router.post(
  "/apply",
  requireAuthentication,
  syncUser,
  validateRequest(cafeApplicationSchema),
  CafeController.submitApplication
);
router.get(
  "/application",
  requireAuthentication,
  syncUser,
  CafeController.getMyApplication
);
router.put(
  "/application/:applicationId",
  requireAuthentication,
  syncUser,
  validateRequest(updateApplicationSchema),
  CafeController.updateApplication
);
router.get(
  "/dashboard",
  requireAuthentication,
  syncUser,
  requireCafeOwner,
  CafeController.getDashboard
);
router.put(
  "/:cafeId",
  requireAuthentication,
  syncUser,
  requireCafeOwnership,
  validateRequest(updateCafeSchema),
  CafeController.updateCafe
);

// Public routes (no auth required)
router.get("/public/list", CafeController.getPublicCafes);

export default router;
