import express from "express";
import OrderController from "../controllers/orderController.js";
import {
  requireAuthentication,
  requireCafeOwnership,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== PUBLIC ROUTES ==========
// Get public queue for a cafe (anyone can view)
router.get("/:cafeId/queue/public", OrderController.getPublicQueue);

// ========== CUSTOMER ROUTES ==========
// Create order (requires authentication)
router.post(
  "/:cafeId/orders",
  requireAuthentication,
  OrderController.createOrder
);

// Get my orders
router.get("/my-orders", requireAuthentication, OrderController.getMyOrders);
router.get(
  "/my-orders/:orderId",
  requireAuthentication,
  OrderController.getMyOrder
);

// ========== CAFE OWNER ROUTES ==========
// Get orders for a cafe
router.get(
  "/:cafeId/orders",
  requireAuthentication,
  requireCafeOwnership,
  OrderController.getCafeOrders
);
router.get(
  "/:cafeId/orders/:orderId",
  requireAuthentication,
  requireCafeOwnership,
  OrderController.getCafeOrder
);

// Update order status
router.patch(
  "/:cafeId/orders/:orderId/status",
  requireAuthentication,
  requireCafeOwnership,
  OrderController.updateOrderStatus
);

// Get cafe queue
router.get(
  "/:cafeId/queue",
  requireAuthentication,
  requireCafeOwnership,
  OrderController.getCafeQueue
);

// Get order statistics
router.get(
  "/:cafeId/stats",
  requireAuthentication,
  requireCafeOwnership,
  OrderController.getCafeOrderStats
);

// Get popular items
router.get(
  "/:cafeId/popular-items",
  requireAuthentication,
  requireCafeOwnership,
  OrderController.getPopularItems
);

export default router;
