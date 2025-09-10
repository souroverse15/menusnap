import { supabase } from "../config/supabase.js";

class MenuCategory {
  // Create a new menu category
  static async create(categoryData) {
    try {
      const { data, error } = await supabase
        .from("menu_categories")
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error creating menu category:", error);
      throw error;
    }
  }

  // Get all categories for a cafe
  static async getByCafeId(cafeId) {
    try {
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("cafe_id", cafeId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("❌ Error fetching menu categories:", error);
      throw error;
    }
  }

  // Get category by ID
  static async getById(categoryId) {
    try {
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("id", categoryId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error fetching menu category:", error);
      throw error;
    }
  }

  // Update category
  static async update(categoryId, updateData) {
    try {
      const { data, error } = await supabase
        .from("menu_categories")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", categoryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error updating menu category:", error);
      throw error;
    }
  }

  // Delete category (soft delete)
  static async delete(categoryId) {
    try {
      const { data, error } = await supabase
        .from("menu_categories")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", categoryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("❌ Error deleting menu category:", error);
      throw error;
    }
  }

  // Reorder categories
  static async reorder(cafeId, categoryOrders) {
    try {
      const promises = categoryOrders.map(({ id, display_order }) =>
        supabase
          .from("menu_categories")
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
      console.error("❌ Error reordering menu categories:", error);
      throw error;
    }
  }
}

export default MenuCategory;
