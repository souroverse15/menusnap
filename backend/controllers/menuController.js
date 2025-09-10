import MenuCategory from "../models/MenuCategory.js";
import MenuItem from "../models/MenuItem.js";
import { z } from "zod";

// Validation schemas
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(255),
  description: z.string().optional(),
  display_order: z.number().int().min(0).optional(),
});

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(255),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  image_url: z.string().url().optional().or(z.literal("")),
  category_id: z.string().uuid().optional(),
  allergens: z.array(z.string()).optional(),
  dietary_info: z.object({}).optional(),
  preparation_time: z.number().int().min(0).optional(),
  display_order: z.number().int().min(0).optional(),
});

class MenuController {
  // ========== CATEGORY ENDPOINTS ==========

  // Get all categories for a cafe
  static async getCategories(req, res) {
    try {
      const { cafeId } = req.params;
      const categories = await MenuCategory.getByCafeId(cafeId);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch categories",
      });
    }
  }

  // Create a new category
  static async createCategory(req, res) {
    try {
      const { cafeId } = req.params;
      const validation = categorySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const categoryData = {
        ...validation.data,
        cafe_id: cafeId,
      };

      const category = await MenuCategory.create(categoryData);

      res.status(201).json({
        success: true,
        data: category,
        message: "Category created successfully",
      });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create category",
      });
    }
  }

  // Update a category
  static async updateCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const validation = categorySchema.partial().safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const category = await MenuCategory.update(categoryId, validation.data);

      res.status(200).json({
        success: true,
        data: category,
        message: "Category updated successfully",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update category",
      });
    }
  }

  // Delete a category
  static async deleteCategory(req, res) {
    try {
      const { categoryId } = req.params;
      await MenuCategory.delete(categoryId);

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete category",
      });
    }
  }

  // Reorder categories
  static async reorderCategories(req, res) {
    try {
      const { cafeId } = req.params;
      const { categoryOrders } = req.body;

      if (!Array.isArray(categoryOrders)) {
        return res.status(400).json({
          success: false,
          error: "categoryOrders must be an array",
        });
      }

      await MenuCategory.reorder(cafeId, categoryOrders);

      res.status(200).json({
        success: true,
        message: "Categories reordered successfully",
      });
    } catch (error) {
      console.error("Error reordering categories:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reorder categories",
      });
    }
  }

  // ========== MENU ITEM ENDPOINTS ==========

  // Get all menu items for a cafe
  static async getMenuItems(req, res) {
    try {
      const { cafeId } = req.params;
      const { categoryId, availableOnly } = req.query;

      const options = {
        categoryId: categoryId || undefined,
        availableOnly: availableOnly === "true",
      };

      const items = await MenuItem.getByCafeId(cafeId, options);

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch menu items",
      });
    }
  }

  // Get full menu structure (categories with items)
  static async getFullMenu(req, res) {
    try {
      const { cafeId } = req.params;
      const { availableOnly } = req.query;

      const options = {
        availableOnly: availableOnly === "true",
      };

      const menu = await MenuItem.getFullMenu(cafeId, options);

      res.status(200).json({
        success: true,
        data: menu,
      });
    } catch (error) {
      console.error("Error fetching full menu:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch menu",
      });
    }
  }

  // Get a single menu item
  static async getMenuItem(req, res) {
    try {
      const { itemId } = req.params;
      const item = await MenuItem.getById(itemId);

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      console.error("Error fetching menu item:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch menu item",
      });
    }
  }

  // Create a new menu item
  static async createMenuItem(req, res) {
    try {
      const { cafeId } = req.params;
      const validation = itemSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const itemData = {
        ...validation.data,
        cafe_id: cafeId,
      };

      const item = await MenuItem.create(itemData);

      res.status(201).json({
        success: true,
        data: item,
        message: "Menu item created successfully",
      });
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create menu item",
      });
    }
  }

  // Update a menu item
  static async updateMenuItem(req, res) {
    try {
      const { itemId } = req.params;
      const validation = itemSchema.partial().safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const item = await MenuItem.update(itemId, validation.data);

      res.status(200).json({
        success: true,
        data: item,
        message: "Menu item updated successfully",
      });
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update menu item",
      });
    }
  }

  // Toggle menu item availability
  static async toggleItemAvailability(req, res) {
    try {
      const { itemId } = req.params;
      const item = await MenuItem.toggleAvailability(itemId);

      res.status(200).json({
        success: true,
        data: item,
        message: `Menu item ${
          item.is_available ? "enabled" : "disabled"
        } successfully`,
      });
    } catch (error) {
      console.error("Error toggling item availability:", error);
      res.status(500).json({
        success: false,
        error: "Failed to toggle item availability",
      });
    }
  }

  // Delete a menu item
  static async deleteMenuItem(req, res) {
    try {
      const { itemId } = req.params;
      await MenuItem.delete(itemId);

      res.status(200).json({
        success: true,
        message: "Menu item deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete menu item",
      });
    }
  }

  // Reorder menu items
  static async reorderMenuItems(req, res) {
    try {
      const { cafeId } = req.params;
      const { itemOrders } = req.body;

      if (!Array.isArray(itemOrders)) {
        return res.status(400).json({
          success: false,
          error: "itemOrders must be an array",
        });
      }

      await MenuItem.reorder(cafeId, itemOrders);

      res.status(200).json({
        success: true,
        message: "Menu items reordered successfully",
      });
    } catch (error) {
      console.error("Error reordering menu items:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reorder menu items",
      });
    }
  }

  // ========== PUBLIC ENDPOINTS ==========

  // Get public menu for a cafe (no authentication required)
  static async getPublicMenu(req, res) {
    try {
      const { cafeId } = req.params;
      // Get full menu with categories and items
      const menu = await MenuItem.getFullMenu(cafeId, {
        availableOnly: true, // Only show available items to public
      });

      res.status(200).json({
        success: true,
        data: menu,
      });
    } catch (error) {
      console.error("Error fetching public menu:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch menu",
      });
    }
  }
}

export default MenuController;
