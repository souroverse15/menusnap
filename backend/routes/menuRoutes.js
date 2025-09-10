import express from "express";
import MenuController from "../controllers/menuController.js";
import {
  requireAuthentication,
  requireCafeOwnership,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== PUBLIC ROUTES ==========
// Get public menu for a cafe (anyone can view)
router.get("/:cafeId/public/menu", MenuController.getPublicMenu);

// ========== PROTECTED ROUTES (Cafe Owners Only) ==========

// Category management routes
router.get(
  "/:cafeId/categories",
  requireAuthentication,
  requireCafeOwnership,
  MenuController.getCategories
);
router.post(
  "/:cafeId/categories",
  requireAuthentication,
  requireCafeOwnership,
  MenuController.createCategory
);
router.put(
  "/categories/:categoryId",
  requireAuthentication,
  MenuController.updateCategory
);
router.delete(
  "/categories/:categoryId",
  requireAuthentication,
  MenuController.deleteCategory
);
router.put(
  "/:cafeId/categories/reorder",
  requireAuthentication,
  requireCafeOwnership,
  MenuController.reorderCategories
);

// Menu item management routes
router.get(
  "/:cafeId/items",
  requireAuthentication,
  requireCafeOwnership,
  MenuController.getMenuItems
);
router.get(
  "/:cafeId/menu",
  requireAuthentication,
  requireCafeOwnership,
  MenuController.getFullMenu
);
router.get("/items/:itemId", requireAuthentication, MenuController.getMenuItem);
router.post(
  "/:cafeId/items",
  requireAuthentication,
  requireCafeOwnership,
  MenuController.createMenuItem
);
router.put(
  "/items/:itemId",
  requireAuthentication,
  MenuController.updateMenuItem
);
router.patch(
  "/items/:itemId/toggle",
  requireAuthentication,
  MenuController.toggleItemAvailability
);
router.delete(
  "/items/:itemId",
  requireAuthentication,
  MenuController.deleteMenuItem
);
router.put(
  "/:cafeId/items/reorder",
  requireAuthentication,
  requireCafeOwnership,
  MenuController.reorderMenuItems
);

export default router;
