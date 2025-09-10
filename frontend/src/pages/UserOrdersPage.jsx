import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import CountdownTimer from "../components/ui/CountdownTimer";
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ChefHat,
  MapPin,
  Phone,
  RefreshCw,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";

const UserOrdersPage = () => {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/orders/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      PENDING: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        text: "Pending",
        description: "Waiting for cafe to accept",
      },
      ACCEPTED: {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
        text: "Accepted",
        description: "Your order has been accepted",
      },
      IN_PROGRESS: {
        color: "bg-purple-100 text-purple-800",
        icon: ChefHat,
        text: "Preparing",
        description: "Your order is being prepared",
      },
      READY: {
        color: "bg-green-100 text-green-800",
        icon: Package,
        text: "Ready",
        description: "Ready for pickup/delivery",
      },
      COMPLETED: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        text: "Completed",
        description: "Order completed",
      },
      CANCELLED: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        text: "Cancelled",
        description: "Order was cancelled",
      },
    };
    return statusMap[status] || statusMap["PENDING"];
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
            </div>
            <Button variant="outline" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 mb-6">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              className="ml-auto"
            >
              Try Again
            </Button>
          </div>
        )}

        {orders.length === 0 ? (
          <EmptyOrdersState />
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                statusInfo={getStatusInfo(order.status)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyOrdersState = () => (
  <div className="text-center py-16">
    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
    <p className="text-gray-600 mb-6">
      You haven't placed any orders yet. Start by browsing our amazing cafes!
    </p>
    <Button onClick={() => (window.location.href = "/cafe")}>
      Browse Cafes
    </Button>
  </div>
);

const OrderCard = ({ order, statusInfo }) => {
  const Icon = statusInfo.icon;

  return (
    <Card className="p-6">
      {/* Order Header */}
      <div className="flex items-start justify-between mb-6">
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
          <p className="text-sm text-gray-500">{statusInfo.description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            ৳{order.total_amount}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Cafe Info */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
        {order.cafes?.logo_url && (
          <img
            src={order.cafes.logo_url}
            alt={order.cafes.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{order.cafes?.name}</h4>
          <div className="flex items-center text-sm text-gray-500 space-x-4 mt-1">
            {order.cafes?.address && (
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {order.cafes.address}
              </div>
            )}
            {order.cafes?.phone && (
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {order.cafes.phone}
              </div>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {order.order_type}
        </Badge>
      </div>

      {/* Order Items */}
      <div className="space-y-3 mb-6">
        <h5 className="font-medium text-gray-900">Order Items</h5>
        <div className="space-y-2">
          {order.order_items?.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                {item.menu_items?.image_url && (
                  <img
                    src={item.menu_items.image_url}
                    alt={item.menu_items.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                <div>
                  <div className="font-medium text-sm">
                    {item.menu_items?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ৳{item.unit_price} × {item.quantity}
                  </div>
                </div>
              </div>
              <div className="font-medium text-sm">
                ৳{(item.unit_price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-sm text-gray-500">Customer</div>
          <div className="font-medium">{order.customer_name}</div>
          {order.customer_phone && (
            <div className="text-sm text-gray-500">{order.customer_phone}</div>
          )}
        </div>

        {order.estimated_ready_time && (
          <div>
            <div className="text-sm text-gray-500">Estimated Ready Time</div>
            <div className="font-medium">
              {new Date(order.estimated_ready_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}

        {order.queue_position && (
          <div>
            <div className="text-sm text-gray-500">Queue Position</div>
            <div className="font-medium">#{order.queue_position}</div>
          </div>
        )}
      </div>

      {/* Special Notes */}
      {order.notes && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Special Instructions</div>
          <div className="text-sm text-gray-700">{order.notes}</div>
        </div>
      )}

      {/* Order Actions */}
      <div className="flex justify-end mt-6 space-x-3">
        {order.status === "PENDING" && (
          <Button variant="outline" size="sm">
            Cancel Order
          </Button>
        )}
        <Button variant="outline" size="sm">
          Reorder
        </Button>
      </div>
    </Card>
  );
};

export default UserOrdersPage;
