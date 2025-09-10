import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  ChefHat,
  Image as ImageIcon,
  Save,
  X,
  AlertCircle,
} from "lucide-react";

const MenuManagement = ({ cafeId }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (cafeId) {
      fetchMenu();
    }
  }, [cafeId]);

  // Show loading if cafeId is not available yet
  if (!cafeId) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="ml-4 text-muted-foreground">
          Loading cafe information...
        </p>
      </div>
    );
  }

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const token = await window.Clerk.session.getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/menu/${cafeId}/menu`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch menu");
      }

      const data = await response.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error("Error fetching menu:", error);
      setError("Failed to load menu. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      console.log("Creating category:", categoryData);
      console.log("Using cafeId:", cafeId);
      const token = await window.Clerk.session.getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/menu/${cafeId}/categories`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        }
      );

      console.log(
        "Category creation response:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Category creation failed:", errorData);
        throw new Error(`Failed to create category: ${response.status}`);
      }

      const result = await response.json();
      console.log("Category created successfully:", result);

      setShowCategoryForm(false);
      fetchMenu(); // Refresh menu
    } catch (error) {
      console.error("Error creating category:", error);
      setError(`Failed to create category: ${error.message}`);
    }
  };

  const handleUpdateCategory = async (categoryId, categoryData) => {
    try {
      const token = await window.Clerk.session.getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/menu/categories/${categoryId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      setEditingCategory(null);
      fetchMenu(); // Refresh menu
    } catch (error) {
      console.error("Error updating category:", error);
      setError("Failed to update category. Please try again.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = await window.Clerk.session.getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/menu/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      fetchMenu(); // Refresh menu
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("Failed to delete category. Please try again.");
    }
  };

  const handleCreateItem = async (itemData) => {
    try {
      const token = await window.Clerk.session.getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/menu/${cafeId}/items`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create menu item");
      }

      setShowItemForm(false);
      setSelectedCategory(null);
      fetchMenu(); // Refresh menu
    } catch (error) {
      console.error("Error creating menu item:", error);
      setError("Failed to create menu item. Please try again.");
    }
  };

  const handleUpdateItem = async (itemId, itemData) => {
    try {
      const token = await window.Clerk.session.getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/menu/items/${itemId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update menu item");
      }

      setEditingItem(null);
      fetchMenu(); // Refresh menu
    } catch (error) {
      console.error("Error updating menu item:", error);
      setError("Failed to update menu item. Please try again.");
    }
  };

  const handleToggleItemAvailability = async (itemId) => {
    try {
      const token = await window.Clerk.session.getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/menu/items/${itemId}/toggle`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle item availability");
      }

      fetchMenu(); // Refresh menu
    } catch (error) {
      console.error("Error toggling item availability:", error);
      setError("Failed to toggle item availability. Please try again.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (
      !confirm(
        "Are you sure you want to delete this menu item? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = await window.Clerk.session.getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/menu/items/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete menu item");
      }

      fetchMenu(); // Refresh menu
    } catch (error) {
      console.error("Error deleting menu item:", error);
      setError("Failed to delete menu item. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
          <p className="text-gray-600">
            Manage your cafe's menu categories and items
          </p>
        </div>
        <Button onClick={() => setShowCategoryForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Categories and Items */}
      {categories.length === 0 ? (
        <EmptyMenuState onAddCategory={() => setShowCategoryForm(true)} />
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              onEditCategory={() => setEditingCategory(category)}
              onDeleteCategory={() => handleDeleteCategory(category.id)}
              onAddItem={() => {
                setSelectedCategory(category.id);
                setShowItemForm(true);
              }}
              onEditItem={setEditingItem}
              onToggleItem={handleToggleItemAvailability}
              onDeleteItem={handleDeleteItem}
            />
          ))}
        </div>
      )}

      {/* Category Form Modal */}
      {(showCategoryForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          onSubmit={
            editingCategory
              ? (data) => handleUpdateCategory(editingCategory.id, data)
              : handleCreateCategory
          }
          onCancel={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Menu Item Form Modal */}
      {(showItemForm || editingItem) && (
        <MenuItemForm
          item={editingItem}
          categories={categories}
          defaultCategoryId={selectedCategory}
          onSubmit={
            editingItem
              ? (data) => handleUpdateItem(editingItem.id, data)
              : handleCreateItem
          }
          onCancel={() => {
            setShowItemForm(false);
            setEditingItem(null);
            setSelectedCategory(null);
          }}
        />
      )}
    </div>
  );
};

const EmptyMenuState = ({ onAddCategory }) => (
  <div className="text-center py-16">
    <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      Start Building Your Menu
    </h3>
    <p className="text-gray-600 mb-6">
      Create categories and add delicious items to showcase your offerings
    </p>
    <Button onClick={onAddCategory}>
      <Plus className="w-4 h-4 mr-2" />
      Create Your First Category
    </Button>
  </div>
);

const CategorySection = ({
  category,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onToggleItem,
  onDeleteItem,
}) => (
  <Card className="p-6">
    {/* Category Header */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
        {category.description && (
          <p className="text-gray-600 text-sm">{category.description}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onAddItem}>
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
        <Button variant="outline" size="sm" onClick={onEditCategory}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDeleteCategory}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>

    {/* Menu Items */}
    {category.items && category.items.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            onEdit={() => onEditItem(item)}
            onToggle={() => onToggleItem(item.id)}
            onDelete={() => onDeleteItem(item.id)}
          />
        ))}
      </div>
    ) : (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">No items in this category yet</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddItem}
          className="mt-2"
        >
          Add First Item
        </Button>
      </div>
    )}
  </Card>
);

const MenuItemCard = ({ item, onEdit, onToggle, onDelete }) => (
  <Card className={`p-4 ${!item.is_available ? "opacity-60" : ""}`}>
    {/* Item Image */}
    <div className="h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>

    {/* Item Info */}
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-gray-900 line-clamp-2">{item.name}</h4>
        <Badge variant={item.is_available ? "success" : "secondary"}>
          {item.is_available ? "Available" : "Unavailable"}
        </Badge>
      </div>

      {item.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="font-semibold text-rose-600">৳{item.price}</span>
        {item.preparation_time && (
          <span className="text-xs text-gray-500">
            {item.preparation_time} min
          </span>
        )}
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
      <div className="flex items-center space-x-1">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="w-3 h-3" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToggle}>
          {item.is_available ? (
            <EyeOff className="w-3 h-3" />
          ) : (
            <Eye className="w-3 h-3" />
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  </Card>
);

const CategoryForm = ({ category, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">
          {category ? "Edit Category" : "Add New Category"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Appetizers, Main Courses"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this category"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : null}
              {category ? "Update" : "Create"} Category
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MenuItemForm = ({
  item,
  categories,
  defaultCategoryId,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || "",
    image_url: item?.image_url || "",
    category_id: item?.category_id || defaultCategoryId || "",
    preparation_time: item?.preparation_time || "",
    allergens: item?.allergens || [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        price: parseFloat(formData.price),
        preparation_time: formData.preparation_time
          ? parseInt(formData.preparation_time)
          : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {item ? "Edit Menu Item" : "Add New Menu Item"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Grilled Chicken"
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Price (৳) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="9.99"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed description of the item"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="prep_time">Preparation Time (minutes)</Label>
              <Input
                id="prep_time"
                type="number"
                min="0"
                value={formData.preparation_time}
                onChange={(e) =>
                  setFormData({ ...formData, preparation_time: e.target.value })
                }
                placeholder="15"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !formData.name.trim() || !formData.price
              }
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : null}
              {item ? "Update" : "Create"} Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuManagement;
