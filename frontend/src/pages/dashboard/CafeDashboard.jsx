import { Routes, Route, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import { useQuery } from "react-query";
import toast from "react-hot-toast";

// Components
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// API
import { supportApi } from "@/lib/api";
import MenuManagement from "../../components/cafe/MenuManagement";
import OrderManagement from "../../components/cafe/OrderManagement";

// Icons
import {
  LayoutDashboard,
  Menu,
  ShoppingBag,
  BarChart3,
  Settings,
  Coffee,
  TrendingUp,
  Clock,
  Users,
  MessageSquare,
  Plus,
} from "lucide-react";

export default function CafeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [cafeId, setCafeId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get cafe information from dashboard API
  useEffect(() => {
    const fetchCafeData = async () => {
      try {
        setLoading(true);
        const token = await window.Clerk.session.getToken();
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/cafe/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCafeId(data.data?.cafe?.id);
          setDashboardData(data.data);
        }
      } catch (error) {
        console.error("Error fetching cafe data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCafeData();
  }, []);

  const navigation = [
    { name: "Overview", id: "overview", icon: LayoutDashboard },
    { name: "Menu", id: "menu", icon: Menu },
    { name: "Orders", id: "orders", icon: ShoppingBag },
    { name: "Analytics", id: "analytics", icon: BarChart3 },
    { name: "Support", id: "support", icon: MessageSquare },
    { name: "Settings", id: "settings", icon: Settings },
  ];

  // Generate dynamic stats from dashboard data
  const stats = dashboardData?.stats
    ? [
        {
          title: "Total Orders",
          value: dashboardData.stats.totalOrders?.toString() || "0",
          change: null,
          changeType: "neutral",
          icon: ShoppingBag,
        },
        {
          title: "This Month",
          value: dashboardData.stats.monthlyOrders?.toString() || "0",
          change: null,
          changeType: "neutral",
          icon: TrendingUp,
        },
        {
          title: "Monthly Limit",
          value: dashboardData.stats.orderLimit?.toString() || "∞",
          change: dashboardData.stats.orderLimit
            ? `${dashboardData.stats.monthlyOrders || 0}/${
                dashboardData.stats.orderLimit
              }`
            : null,
          changeType: "neutral",
          icon: Clock,
        },
        {
          title: "Revenue",
          value: `৳${dashboardData.stats.revenue?.toFixed(2) || "0.00"}`,
          change: null,
          changeType: "positive",
          icon: Users,
        },
      ]
    : [];

  return (
    <DashboardLayout
      user={user}
      navigation={navigation}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title="Café Dashboard"
      notifications={[]}
    >
      <Routes>
        <Route
          path="/"
          element={
            <OverviewTab
              stats={stats}
              cafeData={dashboardData?.cafe}
              recentOrders={dashboardData?.recentOrders || []}
              loading={loading}
            />
          }
        />
        <Route path="/menu" element={<MenuTab cafeId={cafeId} />} />
        <Route path="/orders" element={<OrdersTab cafeId={cafeId} />} />
        <Route path="/analytics" element={<AnalyticsTab cafeId={cafeId} />} />
        <Route path="/support" element={<SupportTab />} />
        <Route path="/settings" element={<SettingsTab cafeId={cafeId} />} />
      </Routes>
    </DashboardLayout>
  );
}

function OverviewTab({ stats, cafeData, recentOrders, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="ml-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back{cafeData?.name ? `, ${cafeData.name}!` : "!"}
        </h2>
        <p className="text-rose-100">
          Manage your digital menu, track orders, and grow your business with
          MenuSnap.
        </p>
        {cafeData?.plan && (
          <div className="mt-4">
            <Badge className="bg-white/20 text-white">
              {cafeData.plan} Plan
            </Badge>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={`text-xs ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                    ? "text-red-600"
                    : "text-muted-foreground"
                }`}
              >
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your café</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center">
                <Menu className="h-5 w-5 text-rose-600 mr-3" />
                <span>Update Menu</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center">
                <ShoppingBag className="h-5 w-5 text-rose-600 mr-3" />
                <span>View Orders</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-rose-600 mr-3" />
                <span>Café Settings</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from your café</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="font-medium text-sm">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()} at{" "}
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <span className="text-sm font-medium">
                        ৳{order.total_amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No recent orders
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Orders will appear here once customers start ordering
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MenuTab({ cafeId }) {
  return <MenuManagement cafeId={cafeId} />;
}

function OrdersTab({ cafeId }) {
  return <OrderManagement cafeId={cafeId} />;
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Analytics & Reports
          </CardTitle>
          <CardDescription>
            Track your café's performance and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
            <p className="text-muted-foreground">
              This section will provide detailed analytics on sales, popular
              items, customer behavior, and more.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SupportTab() {
  const { getToken } = useAuth();

  // Fetch support tickets for this cafe owner
  const {
    data: ticketsData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["cafe-support-tickets"],
    async () => {
      const token = await getToken({ skipCache: true });
      return supportApi.getTickets({}, token);
    },
    {
      retry: 2,
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 30000, // Refetch every 30 seconds
      onError: (error) => {
        console.error("Failed to fetch support tickets:", error);
      },
    }
  );

  const tickets = ticketsData?.data?.tickets || [];

  const getStatusBadge = (status) => {
    const variants = {
      OPEN: "destructive",
      IN_PROGRESS: "default",
      RESOLVED: "secondary",
    };
    return variants[status] || "secondary";
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      LOW: "secondary",
      MEDIUM: "default",
      HIGH: "warning",
      URGENT: "destructive",
    };
    return variants[priority] || "secondary";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Ticket Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Center</h2>
          <p className="text-gray-600">
            Get help from our support team or view your existing tickets
          </p>
        </div>
        <Button asChild>
          <Link to="/support/new">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Link>
        </Button>
      </div>

      {/* Support Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Your Support Tickets
          </CardTitle>
          <CardDescription>
            View and manage your support requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-600">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load support tickets</p>
              <Button onClick={() => refetch()} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Tickets List */}
          {!isLoading && !error && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No support tickets yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Create your first support ticket to get help from our team.
                  </p>
                  <Button asChild>
                    <Link to="/support/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ticket
                    </Link>
                  </Button>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link
                          to={`/support/tickets/${ticket.id}`}
                          className="text-lg font-medium text-gray-900 hover:text-rose-600"
                        >
                          {ticket.subject}
                        </Link>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created {formatDate(ticket.createdAt)}</span>
                        {ticket.messageCount > 0 && (
                          <span className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {ticket.messageCount} messages
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant={getPriorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant={getStatusBadge(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Support Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Common Issues</CardTitle>
            <CardDescription>
              Quick solutions for frequently asked questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/support/new">🔧 Technical Issues</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/support/new">💳 Billing Questions</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/support/new">📊 Analytics Help</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Info</CardTitle>
            <CardDescription>
              Other ways to get in touch with our team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Email:</strong> support@menusnap.com
              </div>
              <div>
                <strong>Response Time:</strong> Usually within 24 hours
              </div>
              <div>
                <strong>Priority Support:</strong> Available for Pro plan users
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Café Settings
          </CardTitle>
          <CardDescription>
            Manage your café information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Settings Coming Soon</h3>
            <p className="text-muted-foreground">
              This section will allow you to update café details, business
              hours, contact information, and more.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
