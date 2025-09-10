import { supabase } from "../config/supabase.js";

class OrderItem {
  // Create order items (usually done in bulk when creating an order)
  static async createBulk(orderItems) {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .insert(orderItems).select(`
          *,
          menu_items (
            id,
            name,
            price,
            image_url
          )
        `);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error creating order items:", error);
      throw error;
    }
  }

  // Get order items by order ID
  static async getByOrderId(orderId) {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select(
          `
          *,
          menu_items (
            id,
            name,
            price,
            image_url,
            description,
            preparation_time
          )
        `
        )
        .eq("order_id", orderId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("❌ Error fetching order items:", error);
      throw error;
    }
  }

  // Update order item (for customizations or special requests)
  static async update(itemId, updateData) {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .update(updateData)
        .eq("id", itemId)
        .select(
          `
          *,
          menu_items (
            id,
            name,
            price,
            image_url
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error updating order item:", error);
      throw error;
    }
  }

  // Delete order item (in case order needs modification before acceptance)
  static async delete(itemId) {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .delete()
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error deleting order item:", error);
      throw error;
    }
  }

  // Calculate total preparation time for order items
  static async calculateTotalPrepTime(orderId) {
    try {
      const items = await this.getByOrderId(orderId);

      const totalPrepTime = items.reduce((total, item) => {
        const prepTime = item.menu_items?.preparation_time || 0;
        return total + prepTime * item.quantity;
      }, 0);

      return totalPrepTime;
    } catch (error) {
      console.error("❌ Error calculating prep time:", error);
      throw error;
    }
  }

  // Get popular items for a cafe (for analytics)
  static async getPopularItems(cafeId, options = {}) {
    try {
      const { startDate, endDate, limit = 10 } = options;

      let query = supabase
        .from("order_items")
        .select(
          `
          menu_item_id,
          quantity,
          menu_items (
            name,
            price,
            image_url
          ),
          orders!inner (
            cafe_id,
            status,
            created_at
          )
        `
        )
        .eq("orders.cafe_id", cafeId)
        .in("orders.status", ["COMPLETED"]); // Only count completed orders

      if (startDate) {
        query = query.gte("orders.created_at", startDate);
      }
      if (endDate) {
        query = query.lte("orders.created_at", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by menu item and calculate totals
      const itemStats = {};
      data.forEach((item) => {
        const itemId = item.menu_item_id;
        if (!itemStats[itemId]) {
          itemStats[itemId] = {
            menu_item: item.menu_items,
            total_quantity: 0,
            total_revenue: 0,
            order_count: 0,
          };
        }
        itemStats[itemId].total_quantity += item.quantity;
        itemStats[itemId].total_revenue +=
          item.quantity * parseFloat(item.menu_items.price);
        itemStats[itemId].order_count += 1;
      });

      // Convert to array and sort by quantity
      const popularItems = Object.values(itemStats)
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, limit);

      return popularItems;
    } catch (error) {
      console.error("❌ Error fetching popular items:", error);
      throw error;
    }
  }
}

export default OrderItem;
