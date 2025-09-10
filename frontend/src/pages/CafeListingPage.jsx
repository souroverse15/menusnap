import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import {
  MapPin,
  Phone,
  Clock,
  Star,
  Users,
  ChefHat,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const CafeListingPage = () => {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCafes();
  }, []);

  const fetchCafes = async () => {
    try {
      setLoading(true);

      // Fetch active cafes from the API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/cafe/public/list`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch cafes");
      }

      const data = await response.json();
      setCafes(data.data || []);
    } catch (error) {
      console.error("Error fetching cafes:", error);
      setError("Failed to load cafes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewMenu = (cafeId) => {
    navigate(`/cafes/${cafeId}/menu`);
  };

  const handleOrderNow = (cafeId) => {
    if (!isSignedIn) {
      navigate(
        "/sign-in?redirect_url=" + encodeURIComponent(`/cafes/${cafeId}/order`)
      );
      return;
    }
    navigate(`/cafes/${cafeId}/order`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchCafes}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-rose-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                MenuSnap Cafes
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {!isSignedIn ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/sign-in")}
                  >
                    Sign In
                  </Button>
                  <Button onClick={() => navigate("/sign-up")}>Sign Up</Button>
                </>
              ) : (
                <Button onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Discover Amazing Local Cafes
          </h2>
          <p className="text-xl text-rose-100 mb-8">
            Browse menus, check wait times, and order your favorites instantly
          </p>
          <div className="flex items-center justify-center space-x-8 text-rose-100">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{cafes.length} Active Cafes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Real-time Queue Updates</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Quality Guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cafes Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {cafes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Cafes Available Yet
            </h3>
            <p className="text-gray-600 mb-6">
              We're working on onboarding amazing cafes to our platform.
            </p>
            <Button onClick={() => navigate("/apply")}>
              Own a Cafe? Apply Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cafes.map((cafe) => (
              <CafeCard
                key={cafe.id}
                cafe={cafe}
                onViewMenu={() => handleViewMenu(cafe.id)}
                onOrderNow={() => handleOrderNow(cafe.id)}
                isSignedIn={isSignedIn}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Own a Cafe?</h3>
          <p className="text-gray-300 mb-6">
            Join MenuSnap and start managing your digital menu and orders
            effortlessly
          </p>
          <Button
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-gray-900"
            onClick={() => navigate("/apply")}
          >
            Apply to Join
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const CafeCard = ({ cafe, onViewMenu, onOrderNow, isSignedIn }) => {
  const [queue, setQueue] = useState([]);
  const [menuItemsCount, setMenuItemsCount] = useState(0);

  useEffect(() => {
    fetchCafeData();
  }, [cafe.id]);

  const fetchCafeData = async () => {
    try {
      // Fetch public queue
      const queueResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/orders/${cafe.id}/queue/public`
      );
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        setQueue(queueData.data || []);
      }

      // Fetch menu to get items count
      const menuResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/menu/${
          cafe.id
        }/public?availableOnly=true`
      );
      if (menuResponse.ok) {
        const menuData = await menuResponse.json();
        const totalItems =
          menuData.data?.reduce(
            (count, category) => count + (category.items?.length || 0),
            0
          ) || 0;
        setMenuItemsCount(totalItems);
      }
    } catch (error) {
      console.error("Error fetching cafe data:", error);
    }
  };

  const getQueueStatus = () => {
    if (queue.length === 0)
      return { text: "No Queue", color: "bg-green-100 text-green-800" };
    if (queue.length <= 2)
      return {
        text: `${queue.length} in queue`,
        color: "bg-yellow-100 text-yellow-800",
      };
    return {
      text: `${queue.length} in queue`,
      color: "bg-red-100 text-red-800",
    };
  };

  const queueStatus = getQueueStatus();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Cafe Image */}
      <div className="h-48 bg-gradient-to-br from-rose-400 to-pink-500 relative">
        {cafe.cover_image_url ? (
          <img
            src={cafe.cover_image_url}
            alt={cafe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="h-16 w-16 text-white opacity-80" />
          </div>
        )}

        {/* Queue Status Badge */}
        <div className="absolute top-4 right-4">
          <Badge className={queueStatus.color}>{queueStatus.text}</Badge>
        </div>
      </div>

      {/* Cafe Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {cafe.name}
            </h3>
            {cafe.description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {cafe.description}
              </p>
            )}
          </div>
          {cafe.logo_url && (
            <img
              src={cafe.logo_url}
              alt={`${cafe.name} logo`}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
        </div>

        {/* Location */}
        {cafe.address && (
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{cafe.address}</span>
          </div>
        )}

        {/* Phone */}
        {cafe.phone && (
          <div className="flex items-center text-gray-600 mb-4">
            <Phone className="h-4 w-4 mr-2" />
            <span className="text-sm">{cafe.phone}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <span>{menuItemsCount} menu items</span>
          <Badge variant="secondary">{cafe.plan}</Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onViewMenu} className="flex-1">
            View Menu
          </Button>
          <Button
            onClick={onOrderNow}
            className="flex-1 bg-rose-600 hover:bg-rose-700"
          >
            {isSignedIn ? "Order Now" : "Sign in to Order"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CafeListingPage;
