import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import {
  ArrowLeft,
  ShoppingCart,
  MapPin,
  Phone,
  CheckCircle,
  AlertCircle,
  User,
  CreditCard,
  Clock,
} from "lucide-react";

const OrderPage = () => {
  const { cafeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [cafe, setCafe] = useState(null);
  const [cart, setCart] = useState(location.state?.cart || []);
  const [orderData, setOrderData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    order_type: "PICKUP",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    if (!isSignedIn) {
      navigate(
        `/sign-in?redirect_url=${encodeURIComponent(location.pathname)}`
      );
      return;
    }

    if (cart.length === 0) {
      navigate(`/cafes/${cafeId}/menu`);
      return;
    }

    fetchCafeData();

    // Pre-fill user data
    if (user) {
      setOrderData((prev) => ({
        ...prev,
        customer_name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        customer_email: user.emailAddresses?.[0]?.emailAddress || "",
      }));
    }
  }, [cafeId, cart, isSignedIn, user, navigate, location.pathname]);

  const fetchCafeData = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/cafe/public/list`
      );
      if (!response.ok) throw new Error("Failed to fetch cafe data");
      const data = await response.json();
      const foundCafe = data.data.find((c) => c.id === cafeId);
      if (!foundCafe) throw new Error("Cafe not found");
      setCafe(foundCafe);
    } catch (error) {
      console.error("Error fetching cafe data:", error);
      setError("Failed to load cafe information");
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!orderData.customer_name.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();

      // Prepare order items for API
      const items = cart.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/orders/${cafeId}/orders`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...orderData,
            items,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to place order");
      }

      const result = await response.json();
      setPlacedOrder(result.data);
      setOrderPlaced(true);
    } catch (error) {
      console.error("Error placing order:", error);
      setError(error.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced && placedOrder) {
    return (
      <OrderConfirmation
        order={placedOrder}
        cafe={cafe}
        onViewOrders={() => navigate("/user/orders")}
        onBackToMenu={() => navigate(`/cafes/${cafeId}/menu`)}
      />
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
                onClick={() => navigate(`/cafes/${cafeId}/menu`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Place Order</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Customer Information
                </h2>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div>
                  <Label htmlFor="customer_name">Full Name *</Label>
                  <Input
                    id="customer_name"
                    value={orderData.customer_name}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        customer_name: e.target.value,
                      }))
                    }
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customer_email">Email</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={orderData.customer_email}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        customer_email: e.target.value,
                      }))
                    }
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="customer_phone">Phone Number</Label>
                  <Input
                    id="customer_phone"
                    type="tel"
                    value={orderData.customer_phone}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        customer_phone: e.target.value,
                      }))
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="order_type">Order Type</Label>
                  <select
                    id="order_type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                    value={orderData.order_type}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        order_type: e.target.value,
                      }))
                    }
                  >
                    <option value="PICKUP">Pickup</option>
                    <option value="DINE_IN">Dine In</option>
                    <option value="DELIVERY">Delivery</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notes">Special Instructions (Optional)</Label>
                  <textarea
                    id="notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                    rows={3}
                    value={orderData.notes}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Any special requests or dietary notes..."
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !orderData.customer_name.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Place Order (৳{calculateTotal().toFixed(2)})
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Cafe Info */}
            {cafe && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  {cafe.logo_url && (
                    <img
                      src={cafe.logo_url}
                      alt={cafe.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{cafe.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      {cafe.address && (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {cafe.address}
                        </div>
                      )}
                      {cafe.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {cafe.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Order Summary */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <ShoppingCart className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Order Summary
                </h3>
              </div>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ৳{item.price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-medium text-gray-900">
                      ৳{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t mt-6 pt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>৳{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </div>
              </div>
            </Card>

            {/* Order Type Info */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {orderData.order_type === "PICKUP" && "Pickup Order"}
                  {orderData.order_type === "DINE_IN" && "Dine In Order"}
                  {orderData.order_type === "DELIVERY" && "Delivery Order"}
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {orderData.order_type === "PICKUP" &&
                  "You will be notified when your order is ready for pickup."}
                {orderData.order_type === "DINE_IN" &&
                  "Your order will be prepared and served at your table."}
                {orderData.order_type === "DELIVERY" &&
                  "Your order will be delivered to your specified address."}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderConfirmation = ({ order, cafe, onViewOrders, onBackToMenu }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="max-w-md w-full mx-4">
      <Card className="p-8 text-center">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-600 mb-6">
          Your order has been successfully submitted to {cafe?.name}.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono font-medium">#{order.id.slice(-8)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-500">Status</span>
            <span className="font-medium text-yellow-600">Pending</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold">৳{order.total_amount}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={onViewOrders} className="w-full">
            View My Orders
          </Button>
          <Button variant="outline" onClick={onBackToMenu} className="w-full">
            Back to Menu
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          You will receive real-time updates about your order status.
        </p>
      </Card>
    </div>
  </div>
);

export default OrderPage;
