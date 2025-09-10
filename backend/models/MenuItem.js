import { supabase } from "../config/supabase.js";

class MenuItem {
  // Create a new menu item
  static async create(itemData) {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert(itemData)
        .select(
          `
          *,
          menu_categories (
            id,
            name
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error creating menu item:", error);
      throw error;
    }
  }

  // Get all menu items for a cafe
  static async getByCafeId(cafeId, options = {}) {
    try {
      let query = supabase
        .from("menu_items")
        .select(
          `
          *,
          menu_categories (
            id,
            name,
            display_order
          )
        `
        )
        .eq("cafe_id", cafeId);

      if (options.availableOnly) {
        query = query.eq("is_available", true);
      }

      if (options.categoryId) {
        query = query.eq("category_id", options.categoryId);
      }

      const { data, error } = await query.order("display_order", {
        ascending: true,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("❌ Error fetching menu items:", error);
      throw error;
    }
  }

  // Get menu item by ID
  static async getById(itemId) {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select(
          `
          *,
          menu_categories (
            id,
            name
          )
        `
        )
        .eq("id", itemId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error fetching menu item:", error);
      throw error;
    }
  }

  // Update menu item
  static async update(itemId, updateData) {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .select(
          `
          *,
          menu_categories (
            id,
            name
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error updating menu item:", error);
      throw error;
    }
  }

  // Delete menu item (soft delete by setting availability to false)
  static async delete(itemId) {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .update({
          is_available: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error deleting menu item:", error);
      throw error;
    }
  }

  // Toggle availability
  static async toggleAvailability(itemId) {
    try {
      // First get current availability
      const currentItem = await this.getById(itemId);

      const { data, error } = await supabase
        .from("menu_items")
        .update({
          is_available: !currentItem.is_available,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error toggling menu item availability:", error);
      throw error;
    }
  }

  // Reorder menu items within a category
  static async reorder(cafeId, itemOrders) {
    try {
      const promises = itemOrders.map(({ id, display_order }) =>
        supabase
          .from("menu_items")
          .update({
            display_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("cafe_id", cafeId)
      );

      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error("❌ Error reordering menu items:", error);
      throw error;
    }
  }

  // Get full menu structure for a cafe (categories with items)
  static async getFullMenu(cafeId, options = {}) {
    try {
      // Get categories
      const { data: categories, error: categoriesError } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("cafe_id", cafeId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (categoriesError) throw categoriesError;

      // Get items for each category
      const categoriesWithItems = await Promise.all(
        categories.map(async (category) => {
          const items = await this.getByCafeId(cafeId, {
            categoryId: category.id,
            availableOnly: options.availableOnly,
          });
          return {
            ...category,
            items: items, // Frontend expects 'items', not 'menu_items'
          };
        })
      );

      return categoriesWithItems;
    } catch (error) {
      console.error("❌ Error fetching full menu:", error);
      throw error;
    }
  }
}

export default MenuItem;
