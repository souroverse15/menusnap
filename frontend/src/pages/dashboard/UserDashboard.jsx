import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "react-query";
import { useSocket } from "@/hooks/useSocket";

// Components
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import CountdownTimer from "@/components/ui/CountdownTimer";

// Icons
import {
  Coffee,
  Store,
  Search,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  LogOut,
  User,
  ShoppingBag,
  Timer,
  Users,
  ChefHat,
  Eye,
  RefreshCw,
} from "lucide-react";

export default function UserDashboard() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();

  // State
  const [cafes, setCafes] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [queueData, setQueueData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      // Listen for queue updates
      socket.on("queue:updated", (data) => {
        setQueueData((prev) => ({
          ...prev,
          [data.cafeId]: data.queue,
        }));
      });

      // Listen for order updates
      socket.on("order:updated", (data) => {
        if (data.order.customer_id === user?.id) {
          fetchRecentOrders(); // Refresh orders if it's this user's order
        }
      });

      return () => {
        socket.off("queue:updated");
        socket.off("order:updated");
      };
    }
  }, [socket, user?.id]);

  // Join queue updates when cafes are loaded
  useEffect(() => {
    if (socket && cafes.length > 0) {
      // Join queue updates for all cafes
      cafes.forEach((cafe) => {
        socket.emit("join_queue_updates", cafe.id);
      });

      return () => {
        // Leave queue updates for all cafes
        cafes.forEach((cafe) => {
          socket.emit("leave_queue_updates", cafe.id);
        });
      };
    }
  }, [socket, cafes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchCafes(), fetchRecentOrders()]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCafes = async () => {
    try {
      console.log("🏪 Fetching cafes for user dashboard...");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/cafe/public/list`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("🏪 Cafes data:", data.data);
        setCafes(data.data || []);

        // Fetch queue data for each cafe
        await fetchQueueData(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching cafes:", error);
    }
  };

  const fetchQueueData = async (cafeList) => {
    try {
      const queuePromises = cafeList.map(async (cafe) => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/orders/${
              cafe.id
            }/queue/public`
          );
          if (response.ok) {
            const data = await response.json();
            return { cafeId: cafe.id, queue: data.data };
          }
        } catch (error) {
          console.error(`Error fetching queue for cafe ${cafe.id}:`, error);
        }
        return { cafeId: cafe.id, queue: { length: 0, estimatedWaitTime: 0 } };
      });

      const queueResults = await Promise.all(queuePromises);
      const queueMap = {};
      queueResults.forEach(({ cafeId, queue }) => {
        queueMap[cafeId] = queue;
      });
      setQueueData(queueMap);
    } catch (error) {
      console.error("Error fetching queue data:", error);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/orders/my-orders?limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRecentOrders(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching recent orders:", error);
    }
  };

  const handleSignOut = async () => {
    queryClient.clear();
    await signOut();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleViewMenu = (cafeId) => {
    navigate(`/cafes/${cafeId}/menu`);
  };

  const handleOrderNow = (cafeId) => {
    navigate(`/cafes/${cafeId}/order`);
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      READY: "bg-green-100 text-green-800",
      COMPLETED: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredCafes = cafes.filter(
    (cafe) =>
      cafe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cafe.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Coffee className="h-8 w-8 text-rose-600" />
              <div>
                <h1 className="text-2xl font-bold gradient-text">MenuSnap</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.firstName || "User"}!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button variant="outline" asChild>
                <Link to="/apply">
                  <Store className="mr-2 h-4 w-4" />
                  Own a café?
                </Link>
              </Button>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-rose-600">
                    {user?.firstName?.[0] || "U"}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg p-8">
            <h2 className="text-3xl font-bold mb-2">
              Discover amazing cafés near you
            </h2>
            <p className="text-rose-100 mb-6">
              Order from your favorite local cafés with MenuSnap's seamless
              digital ordering experience.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for cafés..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Available Cafés */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">
                  Available Cafés ({filteredCafes.length})
                </h3>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/cafes">
                    <Eye className="mr-2 h-4 w-4" />
                    View All
                  </Link>
                </Button>
              </div>

              {filteredCafes.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Coffee className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "No cafés match your search"
                        : "No cafés available"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {filteredCafes.map((cafe) => {
                    const queue = queueData[cafe.id] || {
                      length: 0,
                      estimatedWaitTime: 0,
                    };

                    console.log(
                      "🏪 Rendering cafe card:",
                      cafe.name,
                      "logo_url:",
                      cafe.logo_url
                    );
                    return (
                      <Card key={cafe.id} className="card-hover">
                        <CardContent className="p-0">
                          <div className="flex">
                            <div className="w-32 h-24 bg-gray-200 rounded-l-lg flex items-center justify-center overflow-hidden">
                              {cafe.logo_url ? (
                                <img
                                  src={cafe.logo_url}
                                  alt={cafe.name}
                                  className="w-full h-full object-cover rounded-l-lg"
                                  onError={(e) => {
                                    console.log(
                                      "❌ Image failed to load for cafe:",
                                      cafe.name
                                    );
                                    e.target.style.display = "none";
                                  }}
                                  onLoad={() => {
                                    console.log(
                                      "✅ Image loaded for cafe:",
                                      cafe.name
                                    );
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-gray-500 w-full h-full">
                                  <Coffee className="h-10 w-10 mb-2 text-gray-500" />
                                  <span className="text-xs text-center px-2 text-gray-600 font-medium">
                                    {cafe.name}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-1">
                                    {cafe.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {cafe.description ||
                                      "Quality food and drinks"}
                                  </p>

                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                                    {cafe.address && (
                                      <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {cafe.city}
                                      </div>
                                    )}
                                    {cafe.phone && (
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        Open
                                      </div>
                                    )}
                                  </div>

                                  {/* Queue Information */}
                                  <div className="flex items-center space-x-4 text-sm">
                                    <div className="flex items-center text-blue-600">
                                      <Users className="h-4 w-4 mr-1" />
                                      <span>{queue.length} in queue</span>
                                    </div>
                                    {queue.estimatedWaitTime > 0 && (
                                      <div className="flex items-center text-purple-600">
                                        <Timer className="h-4 w-4 mr-1" />
                                        <span>
                                          {queue.estimatedWaitTime} min wait
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col space-y-2 ml-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewMenu(cafe.id)}
                                  >
                                    <ChefHat className="mr-2 h-4 w-4" />
                                    View Menu
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleOrderNow(cafe.id)}
                                  >
                                    Order Now
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                  <CardDescription>Your order history</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border-b pb-4 last:border-b-0"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {order.cafes?.logo_url ? (
                                  <img
                                    src={order.cafes.logo_url}
                                    alt={order.cafes.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Coffee className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                              <h4 className="font-medium text-sm">
                                {order.cafes?.name || "Unknown Cafe"}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                              <CountdownTimer
                                estimatedReadyTime={order.estimated_ready_time}
                                status={order.status}
                                className="text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm text-muted-foreground">
                              {order.order_items?.length || 0} items
                            </p>
                            <span className="text-sm font-medium">
                              ৳{order.total_amount}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Coffee className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No orders yet
                      </p>
                      <Button size="sm" className="mt-2" asChild>
                        <Link to="/cafes">Start Ordering</Link>
                      </Button>
                    </div>
                  )}

                  {recentOrders.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <Link to="/user/orders">View All Orders</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Café Owner CTA */}
              <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
                <CardContent className="p-6 text-center">
                  <Store className="mx-auto h-10 w-10 text-rose-600 mb-4" />
                  <h3 className="font-semibold mb-2">Own a café?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Join MenuSnap and start accepting digital orders from your
                    customers.
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/apply">Apply Now</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
