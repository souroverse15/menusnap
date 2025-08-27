import { useAuth, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { useQuery } from "react-query";
import { apiClient } from "@/lib/api";

export function RoleBasedRoute({ children, allowedRoles = [] }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  // Fetch user data from backend to get role
  const {
    data: userData,
    isLoading,
    error,
  } = useQuery(
    ["user", user?.id],
    async () => {
      const token = await getToken({ skipCache: true });
      return apiClient.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    {
      enabled: isSignedIn && isLoaded,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  if (error) {
    console.error("Failed to fetch user data:", error);
    return <Navigate to="/sign-in" replace />;
  }

  const userRole = userData?.data?.user?.role;

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
