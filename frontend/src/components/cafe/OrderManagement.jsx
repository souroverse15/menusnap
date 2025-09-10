import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import CountdownTimer from "../ui/CountdownTimer";
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ChefHat,
  User,
  Phone,
  MapPin,
  MessageSquare,
  Timer,
  RefreshCw,
  AlertCircle,
  Users,
} from "lucide-react";

const OrderManagement = ({ cafeId }) => {
  const socket = useSocket();
  const [orders, setOrders] = useState([]);
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (cafeId) {
      fetchOrderData();
      // Set up real-time updates every 30 seconds as fallback
      const interval = setInterval(fetchOrderData, 30000);
      return () => clearInterval(interval);
    }
  }, [cafeId]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (socket && cafeId) {
      // Join cafe orders room
      socket.emit("join_cafe_orders", cafeId);

      // Listen for new orders
      socket.on("order:new", (data) => {
        if (data.cafeId === cafeId) {
          console.log("🆕 New order received:", data.order);
          fetchOrderData(); // Refresh all data
        }
      });

      // Listen for order updates
      socket.on("order:updated", (data) => {
        if (data.cafeId === cafeId) {
          console.log("🔄 Order updated:", data.order);
          fetchOrderData(); // Refresh all data
        }
      });

      // Listen for queue updates
      socket.on("queue:updated", (data) => {
        if (data.cafeId === cafeId) {
          console.log("📊 Queue updated:", data.queue);
          setQueue(data.queue);
        }
      });

      return () => {
        socket.emit("leave_cafe_orders", cafeId);
        socket.off("order:new");
        socket.off("order:updated");
        socket.off("queue:updated");
      };
    }
  }, [socket, cafeId]);

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

  const fetchOrderData = async () => {
    try {
      const token = await window.Clerk.session.getToken();

      // Fetch orders
      const ordersResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/orders/${cafeId}/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!ordersResponse.ok) {
        throw new Error("Failed to fetch orders");
      }

      const ordersData = await ordersResponse.json();
      setOrders(ordersData.data || []);

      // Fetch queue
      const queueResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/orders/${cafeId}/queue`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        setQueue(queueData.data || []);
      }

      // Fetch stats
      const statsResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/orders/${cafeId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || {});
      }

      setError(null);
    } catch (error) {
      console.error("Error fetching order data:", error);
      setError("Failed to load order data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId,
    status,
    estimatedMinutes = null,
    cancellationReason = null
  ) => {
    try {
      const token = await window.Clerk.session.getToken();
      const payload = { status };

      if (estimatedMinutes) payload.estimated_minutes = estimatedMinutes;
      if (cancellationReason) payload.cancellation_reason = cancellationReason;

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/orders/${cafeId}/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      // Refresh data
      fetchOrderData();
    } catch (error) {
      console.error("Error updating order status:", error);
      setError("Failed to update order status. Please try again.");
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      PENDING: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        text: "Pending",
      },
      ACCEPTED: {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
        text: "Accepted",
      },
      IN_PROGRESS: {
        color: "bg-purple-100 text-purple-800",
        icon: ChefHat,
        text: "Preparing",
      },
      READY: {
        color: "bg-green-100 text-green-800",
        icon: Package,
        text: "Ready",
      },
      COMPLETED: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        text: "Completed",
      },
      CANCELLED: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        text: "Cancelled",
      },
    };
    return statusMap[status] || statusMap["PENDING"];
  };

  const filterOrdersByStatus = (status) => {
    return orders.filter((order) => order.status === status);
  };

  const tabs = [
    {
      id: "pending",
      label: "Pending",
      count: filterOrdersByStatus("PENDING").length,
    },
    {
      id: "accepted",
      label: "Accepted",
      count: filterOrdersByStatus("ACCEPTED").length,
    },
    {
      id: "in_progress",
      label: "In Progress",
      count: filterOrdersByStatus("IN_PROGRESS").length,
    },
    {
      id: "ready",
      label: "Ready",
      count: filterOrdersByStatus("READY").length,
    },
    {
      id: "completed",
      label: "Completed",
      count: filterOrdersByStatus("COMPLETED").length,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600">
            Manage incoming orders and track your queue
          </p>
        </div>
        <Button onClick={fetchOrderData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <OrderStats stats={stats} queueLength={queue.length} />

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
            Dismiss
          </Button>
        </div>
      )}

      {/* Current Queue */}
      {queue.length > 0 && <QueueDisplay queue={queue} />}

      {/* Order Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-rose-500 text-rose-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id
                      ? "bg-rose-100 text-rose-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Orders List */}
      <OrdersList
        orders={filterOrdersByStatus(activeTab.toUpperCase())}
        onUpdateStatus={updateOrderStatus}
        getStatusInfo={getStatusInfo}
      />
    </div>
  );
};

const OrderStats = ({ stats, queueLength }) => {
  const statCards = [
    {
      title: "Today's Orders",
      value: stats.total_orders || 0,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "In Queue",
      value: queueLength,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Completed Today",
      value: stats.completed_orders || 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Revenue Today",
      value: `৳${(stats.total_revenue || 0).toFixed(2)}`,
      icon: RefreshCw,
      color: "text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const QueueDisplay = ({ queue }) => (
  <Card className="p-6">
    <div className="flex items-center space-x-3 mb-4">
      <Users className="h-5 w-5 text-gray-500" />
      <h3 className="text-lg font-semibold text-gray-900">Current Queue</h3>
      <Badge>{queue.length} orders</Badge>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {queue.map((order, index) => (
        <div key={order.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">#{order.queue_position}</span>
            <Badge variant="secondary">{order.status}</Badge>
          </div>
          <div className="text-sm text-gray-600">
            <div>{order.customer_name}</div>
            <div className="mt-2">
              <CountdownTimer
                estimatedReadyTime={order.estimated_ready_time}
                status={order.status}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const OrdersList = ({ orders, onUpdateStatus, getStatusInfo }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No orders found
        </h3>
        <p className="text-gray-500">No orders with this status yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          statusInfo={getStatusInfo(order.status)}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </div>
  );
};

const OrderCard = ({ order, statusInfo, onUpdateStatus }) => {
  const [showActions, setShowActions] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [cancellationReason, setCancellationReason] = useState("");

  const Icon = statusInfo.icon;

  const handleAcceptOrder = () => {
    if (estimatedMinutes > 0) {
      onUpdateStatus(order.id, "ACCEPTED", estimatedMinutes);
      setShowActions(false);
    }
  };

  const handleCancelOrder = () => {
    onUpdateStatus(order.id, "CANCELLED", null, cancellationReason);
    setShowActions(false);
    setCancellationReason("");
  };

  return (
    <Card className="p-6">
      {/* Order Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.id.slice(-8)}
            </h3>
            <Badge className={statusInfo.color}>
              <Icon className="h-3 w-3 mr-1" />
              {statusInfo.text}
            </Badge>
            <CountdownTimer
              estimatedReadyTime={order.estimated_ready_time}
              status={order.status}
            />
          </div>
          <div className="text-sm text-gray-500">
            Placed {new Date(order.created_at).toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold text-gray-900">
            ৳{order.total_amount}
          </div>
          <Badge variant="secondary">{order.order_type}</Badge>
        </div>
      </div>

      {/* Customer Info */}
      <div className="flex items-center space-x-6 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{order.customer_name}</span>
        </div>
        {order.customer_phone && (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{order.customer_phone}</span>
          </div>
        )}
        {order.queue_position && (
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Queue #{order.queue_position}</span>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="space-y-2 mb-4">
        <h5 className="font-medium text-gray-900">Items:</h5>
        {order.order_items?.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-1">
            <span className="text-sm">
              {item.quantity}× {item.menu_items?.name}
            </span>
            <span className="text-sm font-medium">
              ৳{(item.unit_price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Special Notes */}
      {order.notes && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-blue-900">
                Special Instructions:
              </div>
              <div className="text-sm text-blue-700">{order.notes}</div>
            </div>
          </div>
        </div>
      )}

      {/* Order Actions */}
      <div className="flex justify-end space-x-3">
        {order.status === "PENDING" && (
          <>
            <Button
              variant="outline"
              onClick={() => setShowActions(!showActions)}
            >
              {showActions ? "Cancel" : "Actions"}
            </Button>

            {showActions && (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) =>
                    setEstimatedMinutes(parseInt(e.target.value))
                  }
                  placeholder="15"
                  className="w-20"
                  min="1"
                />
                <span className="text-sm text-gray-500">min</span>
                <Button onClick={handleAcceptOrder}>Accept</Button>
                <Button variant="outline" onClick={handleCancelOrder}>
                  Decline
                </Button>
              </div>
            )}
          </>
        )}

        {order.status === "ACCEPTED" && (
          <Button onClick={() => onUpdateStatus(order.id, "IN_PROGRESS")}>
            Start Preparing
          </Button>
        )}

        {order.status === "IN_PROGRESS" && (
          <Button onClick={() => onUpdateStatus(order.id, "READY")}>
            Mark Ready
          </Button>
        )}

        {order.status === "READY" && (
          <Button onClick={() => onUpdateStatus(order.id, "COMPLETED")}>
            Complete Order
          </Button>
        )}
      </div>
    </Card>
  );
};

export default OrderManagement;
