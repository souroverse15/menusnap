import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import { z } from "zod";
import { io } from "../server.js";
import {
  emitNewOrder,
  emitOrderUpdate,
  emitQueueUpdate,
} from "../sockets/socketHandlers.js";

// Validation schemas
const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  unit_price: z.number().positive(),
  customizations: z.object({}).optional(),
});

const createOrderSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  order_type: z.enum(["PICKUP", "DINE_IN", "DELIVERY"]).default("PICKUP"),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "ACCEPTED",
    "IN_PROGRESS",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ]),
  estimated_minutes: z.number().int().min(0).optional(),
  cancellation_reason: z.string().optional(),
});

class OrderController {
  // ========== CUSTOMER ENDPOINTS ==========

  // Create a new order
  static async createOrder(req, res) {
    try {
      const { cafeId } = req.params;
      const auth = req.auth();
      if (!auth?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const customerId = auth.userId;

      console.log(
        "🛒 Creating order for cafe:",
        cafeId,
        "customer:",
        customerId
      );

      const validation = createOrderSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const { items, ...orderData } = validation.data;

      // Calculate total amount
      const totalAmount = items.reduce((total, item) => {
        return total + item.unit_price * item.quantity;
      }, 0);

      // Create order
      const order = await Order.create({
        ...orderData,
        cafe_id: cafeId,
        customer_id: customerId,
        total_amount: totalAmount,
      });

      // Create order items
      const orderItemsData = items.map((item) => ({
        ...item,
        order_id: order.id,
      }));

      await OrderItem.createBulk(orderItemsData);

      // Get the complete order with items
      const completeOrder = await Order.getById(order.id);
      console.log("🛒 Order created successfully:", completeOrder.id);

      // Emit real-time event to cafe
      emitNewOrder(io, cafeId, completeOrder);

      // Update queue information for real-time updates
      try {
        const queueData = await Order.getQueueInfo(cafeId);
        console.log("🛒 Queue data after order creation:", queueData);
        emitQueueUpdate(io, cafeId, queueData);
      } catch (queueError) {
        console.error(
          "Error fetching queue data after order creation:",
          queueError
        );
      }

      res.status(201).json({
        success: true,
        data: completeOrder,
        message: "Order created successfully",
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create order",
      });
    }
  }

  // Get orders for the current customer
  static async getMyOrders(req, res) {
    try {
      const auth = req.auth();

      if (!auth?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const customerId = auth.userId;
      console.log("📋 Fetching orders for customer:", customerId);
      const { status, limit } = req.query;

      const options = {
        status: status || undefined,
        limit: limit ? parseInt(limit) : undefined,
      };

      const orders = await Order.getByCustomerId(customerId, options);
      console.log("📋 Found orders for customer:", orders.length, "orders");

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch orders",
      });
    }
  }

  // Get a specific order for the current customer
  static async getMyOrder(req, res) {
    try {
      const { orderId } = req.params;
      const auth = req.auth();

      if (!auth?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const customerId = auth.userId;

      const order = await Order.getById(orderId);

      // Check if order belongs to customer
      if (order.customer_id !== customerId) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch order",
      });
    }
  }

  // ========== CAFE OWNER ENDPOINTS ==========

  // Get orders for a cafe
  static async getCafeOrders(req, res) {
    try {
      const { cafeId } = req.params;
      const { status, limit } = req.query;

      console.log("🏪 Fetching orders for cafe:", cafeId, "with options:", {
        status,
        limit,
      });

      const options = {
        status: status || undefined,
        limit: limit ? parseInt(limit) : undefined,
      };

      const orders = await Order.getByCafeId(cafeId, options);
      console.log("🏪 Found orders for cafe:", orders.length, "orders");

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      console.error("Error fetching cafe orders:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch orders",
      });
    }
  }

  // Get a specific order for a cafe
  static async getCafeOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await Order.getById(orderId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch order",
      });
    }
  }

  // Update order status
  static async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const validation = updateOrderStatusSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const { status, estimated_minutes, cancellation_reason } =
        validation.data;
      let updatedOrder;

      switch (status) {
        case "ACCEPTED":
          if (!estimated_minutes) {
            return res.status(400).json({
              success: false,
              error: "estimated_minutes is required when accepting an order",
            });
          }
          updatedOrder = await Order.acceptOrder(orderId, estimated_minutes);
          break;

        case "IN_PROGRESS":
          updatedOrder = await Order.startPreparation(orderId);
          break;

        case "READY":
          updatedOrder = await Order.markReady(orderId);
          break;

        case "COMPLETED":
          updatedOrder = await Order.completeOrder(orderId);
          break;

        case "CANCELLED":
          updatedOrder = await Order.cancelOrder(orderId, cancellation_reason);
          break;

        default:
          updatedOrder = await Order.updateStatus(orderId, status);
      }

      // Emit real-time updates
      emitOrderUpdate(io, orderId, updatedOrder.cafe_id, updatedOrder);

      // Update queue and emit queue update
      const queue = await Order.getQueue(updatedOrder.cafe_id);
      emitQueueUpdate(io, updatedOrder.cafe_id, queue);

      res.status(200).json({
        success: true,
        data: updatedOrder,
        message: `Order ${status.toLowerCase()} successfully`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update order status",
      });
    }
  }

  // Get current queue for a cafe
  static async getCafeQueue(req, res) {
    try {
      const { cafeId } = req.params;
      const queue = await Order.getQueue(cafeId);

      res.status(200).json({
        success: true,
        data: queue,
      });
    } catch (error) {
      console.error("Error fetching queue:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch queue",
      });
    }
  }

  // Get order statistics for a cafe
  static async getCafeOrderStats(req, res) {
    try {
      const { cafeId } = req.params;
      const { startDate, endDate } = req.query;

      const options = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const stats = await Order.getStats(cafeId, options);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching order stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch order statistics",
      });
    }
  }

  // Get popular menu items for a cafe
  static async getPopularItems(req, res) {
    try {
      const { cafeId } = req.params;
      const { startDate, endDate, limit } = req.query;

      const options = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: limit ? parseInt(limit) : 10,
      };

      const popularItems = await OrderItem.getPopularItems(cafeId, options);

      res.status(200).json({
        success: true,
        data: popularItems,
      });
    } catch (error) {
      console.error("Error fetching popular items:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch popular items",
      });
    }
  }

  // ========== PUBLIC ENDPOINTS ==========

  // Get public queue for a cafe (for customers to view before ordering)
  static async getPublicQueue(req, res) {
    try {
      const { cafeId } = req.params;
      const queue = await Order.getQueue(cafeId);

      // Remove sensitive customer information for public view
      const publicQueue = queue.map((order) => ({
        id: order.id,
        customer_name: order.customer_name.charAt(0) + "***", // Anonymize name
        status: order.status,
        estimated_ready_time: order.estimated_ready_time,
        queue_position: order.queue_position,
        items_count: order.order_items?.length || 0,
      }));

      res.status(200).json({
        success: true,
        data: publicQueue,
      });
    } catch (error) {
      console.error("Error fetching public queue:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch queue",
      });
    }
  }
}

export default OrderController;
