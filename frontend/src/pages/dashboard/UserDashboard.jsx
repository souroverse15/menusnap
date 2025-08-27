import { useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useQueryClient } from "react-query";

// Components
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

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
} from "lucide-react";

export default function UserDashboard() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    // Clear all cached queries
    queryClient.clear();

    // Sign out from Clerk
    await signOut();
  };

  const nearbycafes = [
    {
      id: 1,
      name: "The Coffee Corner",
      description: "Artisan coffee and fresh pastries",
      rating: 4.8,
      distance: "0.3 miles",
      image: "/api/placeholder/300/200",
      isOpen: true,
    },
    {
      id: 2,
      name: "Brew & Bite",
      description: "Specialty coffee and light meals",
      rating: 4.6,
      distance: "0.5 miles",
      image: "/api/placeholder/300/200",
      isOpen: true,
    },
    {
      id: 3,
      name: "Morning Glory Café",
      description: "Fresh breakfast and premium coffee",
      rating: 4.7,
      distance: "0.8 miles",
      image: "/api/placeholder/300/200",
      isOpen: false,
    },
  ];

  const recentOrders = [
    {
      id: 1,
      cafeName: "The Coffee Corner",
      items: ["Cappuccino", "Croissant"],
      total: 8.5,
      date: "2024-01-15T10:30:00Z",
      status: "completed",
    },
    {
      id: 2,
      cafeName: "Brew & Bite",
      items: ["Latte", "Avocado Toast"],
      total: 12.75,
      date: "2024-01-14T15:45:00Z",
      status: "completed",
    },
  ];

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
              <Button variant="outline" asChild>
                <Link to="/apply">
                  <Store className="mr-2 h-4 w-4" />
                  Own a café?
                </Link>
              </Button>

              {/* User Menu */}
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
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Nearby Cafés */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Nearby Cafés</h3>
                <Button variant="outline" size="sm">
                  <MapPin className="mr-2 h-4 w-4" />
                  View Map
                </Button>
              </div>

              <div className="grid gap-6">
                {nearbycafes.map((cafe) => (
                  <Card key={cafe.id} className="card-hover">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="w-32 h-24 bg-gray-200 rounded-l-lg flex items-center justify-center">
                          <Coffee className="h-8 w-8 text-gray-400" />
                        </div>

                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold mb-1">
                                {cafe.name}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {cafe.description}
                              </p>

                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                  {cafe.rating}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {cafe.distance}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span
                                    className={
                                      cafe.isOpen
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                  >
                                    {cafe.isOpen ? "Open" : "Closed"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Button size="sm" disabled={!cafe.isOpen}>
                              Order Now
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
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
                            <h4 className="font-medium text-sm">
                              {order.cafeName}
                            </h4>
                            <span className="text-sm font-medium">
                              ${order.total}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {order.items.join(", ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.date).toLocaleDateString()}
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
