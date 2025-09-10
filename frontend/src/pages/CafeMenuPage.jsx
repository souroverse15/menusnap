import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useSocket } from "@/hooks/useSocket";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import {
  MapPin,
  Phone,
  Clock,
  Users,
  ShoppingCart,
  Plus,
  Minus,
  ChefHat,
  ArrowLeft,
  AlertCircle,
  Timer,
  Coffee,
  Store,
} from "lucide-react";

const CafeMenuPage = () => {
  const { cafeId } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const socket = useSocket();

  const [cafe, setCafe] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [queueInfo, setQueueInfo] = useState({
    length: 0,
    estimatedWaitTime: 0,
  });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchCafeData();
  }, [cafeId]);

  // Socket events for real-time queue updates
  useEffect(() => {
    if (socket && cafeId) {
      // Join queue updates for this cafe
      socket.emit("join_queue_updates", cafeId);

      // Listen for queue updates
      socket.on("queue:updated", (data) => {
        if (data.cafeId === cafeId) {
          setQueueInfo(data.queue);
        }
      });

      return () => {
        socket.emit("leave_queue_updates", cafeId);
        socket.off("queue:updated");
      };
    }
  }, [socket, cafeId]);

  const fetchCafeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch cafe details
      const cafeResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/cafe/public/list`
      );
      if (!cafeResponse.ok) throw new Error("Failed to fetch cafe data");
      const cafeData = await cafeResponse.json();
      const foundCafe = cafeData.data.find((c) => c.id === cafeId);
      if (!foundCafe) throw new Error("Cafe not found");
      setCafe(foundCafe);

      // Fetch menu with categories
      try {
        const menuResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/menu/${cafeId}/public/menu`
        );
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenuCategories(menuData.data || []);
        } else {
          setMenuCategories([]);
        }
      } catch (menuError) {
        console.log("No menu available for this cafe");
        setMenuCategories([]);
      }

      // Fetch queue information
      try {
        const queueResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/orders/${cafeId}/queue/public`
        );
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          setQueueInfo(queueData.data);
        }
      } catch (queueError) {
        console.log("Could not fetch queue data");
        setQueueInfo({ length: 0, estimatedWaitTime: 0 });
      }
    } catch (error) {
      console.error("Error fetching cafe data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, change) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + change;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleProceedToOrder = () => {
    if (!isSignedIn) {
      navigate(
        `/sign-in?redirect_url=${encodeURIComponent(`/cafes/${cafeId}/order`)}`
      );
      return;
    }
    navigate(`/cafes/${cafeId}/order`, { state: { cart } });
  };

  const getAllItems = () => {
    const allItems = [];
    menuCategories.forEach((category) => {
      if (category.items) {
        allItems.push(...category.items);
      }
    });
    return allItems;
  };

  const getFilteredItems = () => {
    if (activeCategory === "all") {
      return getAllItems();
    }
    const category = menuCategories.find((cat) => cat.id === activeCategory);
    return category?.items || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Cafe</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/cafes")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/cafes")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {cart.length > 0 && (
              <Button onClick={handleProceedToOrder} className="relative">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Order Now ({getTotalItems()})
                <Badge className="ml-2 bg-white text-primary">
                  ৳{getTotalPrice().toFixed(2)}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Cafe Info */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="text-center">
                  {cafe.logo_url ? (
                    <img
                      src={cafe.logo_url}
                      alt={cafe.name}
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
                      <Store className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  <h1 className="text-2xl font-bold mb-2">{cafe.name}</h1>
                  <p className="text-muted-foreground mb-4">
                    {cafe.description || "Quality food and drinks"}
                  </p>

                  {cafe.address && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {cafe.city}
                    </div>
                  )}

                  {cafe.phone && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-1" />
                      {cafe.phone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Queue Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Current Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {queueInfo.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        People in queue:
                      </span>
                      <Badge variant="secondary">{queueInfo.length}</Badge>
                    </div>
                    {queueInfo.estimatedWaitTime > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Estimated wait:
                        </span>
                        <div className="flex items-center text-sm">
                          <Timer className="h-4 w-4 mr-1 text-purple-600" />
                          <span>{queueInfo.estimatedWaitTime} min</span>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Queue updates in real-time
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Queue is empty
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Perfect time to order!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Filter */}
            {menuCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Menu Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant={activeCategory === "all" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveCategory("all")}
                    >
                      <ChefHat className="mr-2 h-4 w-4" />
                      All Items ({getAllItems().length})
                    </Button>
                    {menuCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={
                          activeCategory === category.id ? "default" : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => setActiveCategory(category.id)}
                      >
                        <Coffee className="mr-2 h-4 w-4" />
                        {category.name} ({category.items?.length || 0})
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {menuCategories.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <ChefHat className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">
                    No Menu Available
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    This cafe hasn't added their menu yet. Please check back
                    later.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/cafes")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Cafes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {activeCategory === "all"
                      ? "All Menu Items"
                      : menuCategories.find((cat) => cat.id === activeCategory)
                          ?.name}
                  </h2>
                  <Badge variant="secondary">
                    {getFilteredItems().length} items
                  </Badge>
                </div>

                {getFilteredItems().length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Coffee className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No items in this category yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {getFilteredItems().map((item) => {
                      const cartItem = cart.find((c) => c.id === item.id);
                      const quantity = cartItem?.quantity || 0;

                      return (
                        <Card
                          key={item.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold text-lg">
                                    {item.name}
                                  </h3>
                                  {!item.is_available && (
                                    <Badge variant="destructive">
                                      Unavailable
                                    </Badge>
                                  )}
                                </div>

                                {item.description && (
                                  <p className="text-muted-foreground text-sm mb-3">
                                    {item.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center text-lg font-bold text-primary">
                                      ৳{item.price}
                                    </div>
                                    {item.preparation_time && (
                                      <div className="flex items-center text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {item.preparation_time} min
                                      </div>
                                    )}
                                  </div>

                                  {item.is_available ? (
                                    <div className="flex items-center space-x-2">
                                      {quantity > 0 && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              updateQuantity(item.id, -1)
                                            }
                                          >
                                            <Minus className="h-4 w-4" />
                                          </Button>
                                          <span className="font-medium w-8 text-center">
                                            {quantity}
                                          </span>
                                        </>
                                      )}
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          quantity > 0
                                            ? updateQuantity(item.id, 1)
                                            : addToCart(item)
                                        }
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button size="sm" disabled>
                                      Unavailable
                                    </Button>
                                  )}
                                </div>

                                {item.allergens &&
                                  item.allergens.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-xs text-muted-foreground">
                                        Allergens: {item.allergens.join(", ")}
                                      </p>
                                    </div>
                                  )}
                              </div>

                              {item.image_url && (
                                <div className="ml-4 flex-shrink-0">
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-20 h-20 rounded-lg object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 min-w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Your Order</h3>
            <Badge>{getTotalItems()} items</Badge>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>৳{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>৳{getTotalPrice().toFixed(2)}</span>
            </div>
            <Button onClick={handleProceedToOrder} className="w-full mt-3">
              Proceed to Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CafeMenuPage;
