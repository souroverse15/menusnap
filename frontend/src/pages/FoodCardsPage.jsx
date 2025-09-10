import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Input } from "../components/ui/Input";
import {
  Search,
  Filter,
  Clock,
  Star,
  Users,
  ChefHat,
  ArrowRight,
  X,
  MapPin,
} from "lucide-react";

const FoodCardsPage = () => {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState([]);
  const [allFoodItems, setAllFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCafesAndMenu();
  }, []);

  useEffect(() => {
    filterItems();
  }, [allFoodItems, searchTerm, selectedCategory, priceRange]);

  const fetchCafesAndMenu = async () => {
    try {
      setLoading(true);
      console.log("🍽️ Fetching cafes and menus...");

      // Fetch cafes
      const cafesResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/cafe/public/list`
      );
      if (!cafesResponse.ok) throw new Error("Failed to fetch cafes");
      const cafesData = await cafesResponse.json();
      console.log("🏪 Cafes fetched:", cafesData.data?.length || 0, "cafes");
      setCafes(cafesData.data || []);

      // Fetch menu for each cafe
      const menuPromises = cafesData.data.map(async (cafe) => {
        try {
          console.log(`📋 Fetching menu for cafe: ${cafe.name} (${cafe.id})`);
          const menuResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/menu/${cafe.id}/public/menu`
          );
          if (menuResponse.ok) {
            const menuData = await menuResponse.json();
            console.log(
              `📋 Menu for ${cafe.name}:`,
              menuData.data?.length || 0,
              "categories"
            );
            return {
              cafe,
              menu: menuData.data || [],
            };
          }
          console.log(`❌ Failed to fetch menu for ${cafe.name}`);
          return { cafe, menu: [] };
        } catch (error) {
          console.error(`Error fetching menu for cafe ${cafe.id}:`, error);
          return { cafe, menu: [] };
        }
      });

      const menuResults = await Promise.all(menuPromises);
      console.log("📋 All menu results:", menuResults);

      // Flatten all food items with cafe info
      const foodItems = [];
      const allCategories = new Set();

      menuResults.forEach(({ cafe, menu }) => {
        console.log(`🍽️ Processing menu for ${cafe.name}:`, menu);
        menu.forEach((category) => {
          allCategories.add(category.name);
          console.log(
            `📂 Category ${category.name} has ${
              category.items?.length || 0
            } items`
          );
          category.items?.forEach((item) => {
            console.log(`🍕 Adding item: ${item.name} from ${cafe.name}`);
            foodItems.push({
              ...item,
              cafe: {
                id: cafe.id,
                name: cafe.name,
                logo_url: cafe.logo_url,
                address: cafe.address,
                city: cafe.city,
              },
              category: category.name,
            });
          });
        });
      });

      console.log("🍽️ Total food items found:", foodItems.length);
      console.log("📂 Categories found:", Array.from(allCategories));
      setAllFoodItems(foodItems);
      setCategories(Array.from(allCategories).sort());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    console.log("🔍 Filtering items...", {
      allFoodItems: allFoodItems.length,
      searchTerm,
      selectedCategory,
      priceRange,
    });

    let filtered = allFoodItems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.cafe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Price filter
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      if (max) {
        filtered = filtered.filter(
          (item) => item.price >= min && item.price <= max
        );
      } else {
        filtered = filtered.filter((item) => item.price >= min);
      }
    }

    console.log("🔍 Filtered items:", filtered.length);
    setFilteredItems(filtered);
  };

  const handleOrderNow = (cafeId) => {
    navigate(`/cafes/${cafeId}/order`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange("all");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing Food
          </h1>
          <p className="text-xl text-gray-600">
            Order from your favorite restaurants and cafes
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search food, restaurant, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Prices</option>
                    <option value="0-100">Under ৳100</option>
                    <option value="100-200">৳100 - ৳200</option>
                    <option value="200-300">৳200 - ৳300</option>
                    <option value="300-500">৳300 - ৳500</option>
                    <option value="500">Above ৳500</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {filteredItems.length} food items found
          </p>
        </div>

        {/* Food Cards Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card
                key={`${item.cafe.id}-${item.id}`}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                onClick={() => handleOrderNow(item.cafe.id)}
              >
                {/* Food Image */}
                <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <ChefHat className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Food Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
                      {item.name}
                    </h3>
                    <Badge variant="secondary" className="ml-2">
                      {item.category}
                    </Badge>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Restaurant Info */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {item.cafe.logo_url ? (
                        <img
                          src={item.cafe.logo_url}
                          alt={item.cafe.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ChefHat className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.cafe.name}
                    </span>
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-green-600">
                      ৳{item.price}
                    </div>
                    <Button size="sm" className="flex items-center space-x-1">
                      <span>Order Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Preparation Time */}
                  {item.preparation_time && (
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{item.preparation_time} min</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No food items found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filters
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodCardsPage;
