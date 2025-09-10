import { supabase } from "../config/supabase.js";

class Order {
  // Create a new order
  static async create(orderData) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert(orderData)
        .select(
          `
          *,
          cafes (
            id,
            name,
            phone,
            address
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error creating order:", error);
      throw error;
    }
  }

  // Get order by ID with full details
  static async getById(orderId) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          cafes (
            id,
            name,
            phone,
            address,
            logo_url
          ),
          order_items (
            *,
            menu_items (
              id,
              name,
              price,
              image_url
            )
          )
        `
        )
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error fetching order:", error);
      throw error;
    }
  }

  // Get orders for a cafe with filtering options
  static async getByCafeId(cafeId, options = {}) {
    try {
      console.log("🔍 Order.getByCafeId called with:", { cafeId, options });

      let query = supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            *,
            menu_items (
              id,
              name,
              price,
              image_url
            )
          )
        `
        )
        .eq("cafe_id", cafeId);

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("❌ Supabase error in getByCafeId:", error);
        throw error;
      }

      console.log("🔍 getByCafeId result:", {
        dataLength: data?.length || 0,
        data,
      });
      return data || [];
    } catch (error) {
      console.error("❌ Error fetching cafe orders:", error);
      throw error;
    }
  }

  // Get orders for a customer
  static async getByCustomerId(customerId, options = {}) {
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          cafes (
            id,
            name,
            logo_url,
            address,
            phone
          ),
          order_items (
            *,
            menu_items (
              id,
              name,
              price,
              image_url
            )
          )
        `
        )
        .eq("customer_id", customerId);

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("❌ Error fetching customer orders:", error);
      throw error;
    }
  }

  // Update order status
  static async updateStatus(orderId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData,
      };

      const { data, error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select(
          `
          *,
          cafes (
            id,
            name,
            phone,
            address
          ),
          order_items (
            *,
            menu_items (
              id,
              name,
              price,
              image_url
            )
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error updating order status:", error);
      throw error;
    }
  }

  // Get current queue for a cafe
  static async getQueue(cafeId) {
    try {
      console.log("🔍 Getting queue for cafe:", cafeId);

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          customer_name,
          status,
          estimated_ready_time,
          queue_position,
          created_at,
          order_items (
            quantity,
            menu_items (
              name,
              preparation_time
            )
          )
        `
        )
        .eq("cafe_id", cafeId)
        .in("status", ["ACCEPTED", "IN_PROGRESS"])
        .order("queue_position", { ascending: true });

      if (error) {
        console.error("❌ Supabase error in getQueue:", error);
        throw error;
      }

      console.log("🔍 Queue result:", { dataLength: data?.length || 0, data });
      return data || [];
    } catch (error) {
      console.error("❌ Error fetching queue:", error);
      throw error;
    }
  }

  // Update queue positions after status change
  static async updateQueuePositions(cafeId) {
    try {
      // Get all orders in queue
      const queueOrders = await this.getQueue(cafeId);

      // Update queue positions
      const promises = queueOrders.map((order, index) =>
        supabase
          .from("orders")
          .update({
            queue_position: index + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)
      );

      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating queue positions:", error);
      throw error;
    }
  }

  // Accept order and add to queue
  static async acceptOrder(orderId, estimatedMinutes) {
    try {
      const estimatedReadyTime = new Date();
      estimatedReadyTime.setMinutes(
        estimatedReadyTime.getMinutes() + estimatedMinutes
      );

      // Get current queue length for this cafe
      const order = await this.getById(orderId);
      const queueOrders = await this.getQueue(order.cafe_id);
      const queuePosition = queueOrders.length + 1;

      const updatedOrder = await this.updateStatus(orderId, "ACCEPTED", {
        estimated_ready_time: estimatedReadyTime.toISOString(),
        queue_position: queuePosition,
      });

      return updatedOrder;
    } catch (error) {
      console.error("❌ Error accepting order:", error);
      throw error;
    }
  }

  // Start preparing order (move to IN_PROGRESS)
  static async startPreparation(orderId) {
    try {
      const updatedOrder = await this.updateStatus(orderId, "IN_PROGRESS");

      // Update queue positions for remaining orders
      await this.updateQueuePositions(updatedOrder.cafe_id);

      return updatedOrder;
    } catch (error) {
      console.error("❌ Error starting order preparation:", error);
      throw error;
    }
  }

  // Mark order as ready
  static async markReady(orderId) {
    try {
      const updatedOrder = await this.updateStatus(orderId, "READY");

      // Update queue positions for remaining orders
      await this.updateQueuePositions(updatedOrder.cafe_id);

      return updatedOrder;
    } catch (error) {
      console.error("❌ Error marking order as ready:", error);
      throw error;
    }
  }

  // Complete order
  static async completeOrder(orderId) {
    try {
      const updatedOrder = await this.updateStatus(orderId, "COMPLETED", {
        queue_position: null,
      });

      // Update queue positions for remaining orders
      await this.updateQueuePositions(updatedOrder.cafe_id);

      return updatedOrder;
    } catch (error) {
      console.error("❌ Error completing order:", error);
      throw error;
    }
  }

  // Cancel order
  static async cancelOrder(orderId, reason = null) {
    try {
      const order = await this.getById(orderId);

      const updatedOrder = await this.updateStatus(orderId, "CANCELLED", {
        notes: reason
          ? `${order.notes || ""}\nCancellation reason: ${reason}`
          : order.notes,
        queue_position: null,
      });

      // Update queue positions for remaining orders
      await this.updateQueuePositions(updatedOrder.cafe_id);

      return updatedOrder;
    } catch (error) {
      console.error("❌ Error cancelling order:", error);
      throw error;
    }
  }

  // Get order statistics for a cafe
  static async getStats(cafeId, options = {}) {
    try {
      console.log(
        "📊 Getting stats for cafe:",
        cafeId,
        "with options:",
        options
      );

      const { startDate, endDate } = options;

      let query = supabase
        .from("orders")
        .select("status, total_amount, created_at")
        .eq("cafe_id", cafeId);

      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Supabase error in getStats:", error);
        throw error;
      }

      // Calculate statistics
      const stats = {
        total_orders: data.length,
        pending_orders: data.filter((o) => o.status === "PENDING").length,
        accepted_orders: data.filter((o) => o.status === "ACCEPTED").length,
        in_progress_orders: data.filter((o) => o.status === "IN_PROGRESS")
          .length,
        completed_orders: data.filter((o) => o.status === "COMPLETED").length,
        cancelled_orders: data.filter((o) => o.status === "CANCELLED").length,
        total_revenue: data
          .filter((o) => ["COMPLETED"].includes(o.status))
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
      };

      console.log("📊 Stats calculated:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error fetching order stats:", error);
      throw error;
    }
  }

  // Get public queue information for customers
  static async getQueueInfo(cafeId) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          estimated_ready_time,
          queue_position,
          order_items (
            quantity,
            menu_items (
              preparation_time
            )
          )
        `
        )
        .eq("cafe_id", cafeId)
        .in("status", ["ACCEPTED", "IN_PROGRESS"])
        .order("queue_position", { ascending: true });

      if (error) throw error;

      const queueLength = data.length;
      let estimatedWaitTime = 0;

      if (queueLength > 0) {
        // Calculate estimated wait time based on the last order in queue
        const lastOrder = data[data.length - 1];
        if (lastOrder.estimated_ready_time) {
          const now = new Date();
          const readyTime = new Date(lastOrder.estimated_ready_time);
          estimatedWaitTime = Math.max(
            0,
            Math.ceil((readyTime - now) / (1000 * 60))
          );
        } else {
          // Fallback: estimate based on average preparation time
          const avgPrepTime =
            data.reduce((sum, order) => {
              const orderPrepTime = order.order_items.reduce(
                (itemSum, item) => {
                  return (
                    itemSum +
                    (item.menu_items?.preparation_time || 15) * item.quantity
                  );
                },
                0
              );
              return sum + orderPrepTime;
            }, 0) / queueLength;

          estimatedWaitTime = Math.ceil(avgPrepTime);
        }
      }

      return {
        length: queueLength,
        estimatedWaitTime,
        currentlyServing: queueLength > 0 ? data[0]?.queue_position || 1 : 0,
      };
    } catch (error) {
      console.error("❌ Error fetching queue info:", error);
      throw error;
    }
  }
}

export default Order;
