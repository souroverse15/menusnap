import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

// Components
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleBasedRoute } from "./components/auth/RoleBasedRoute";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";

// Pages
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";

// Dashboard Pages
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import CafeDashboard from "./pages/dashboard/CafeDashboard";
import UserDashboard from "./pages/dashboard/UserDashboard";

// Application Flow
import CafeApplicationWizard from "./pages/application/CafeApplicationWizard";
import ApplicationStatus from "./pages/application/ApplicationStatus";
import ApplicationWaiting from "./pages/application/ApplicationWaiting";

// Error Pages
import NotFoundPage from "./pages/errors/NotFoundPage";
import UnauthorizedPage from "./pages/errors/UnauthorizedPage";

// Support pages
import TicketDetailPage from "./pages/support/TicketDetailPage";

// Hooks
import { useSocket } from "./hooks/useSocket";
import { useUserSync } from "./hooks/useUserSync";

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Initialize socket connection when user is signed in
  useSocket(isSignedIn);

  // Sync user data with backend (only when signed in)
  const { userData, isLoading: userSyncLoading } = useUserSync(
    isSignedIn,
    user
  );

  // Show loading spinner while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* Protected Routes */}
        <Route
          path="/apply"
          element={
            <ProtectedRoute>
              <CafeApplicationWizard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/application-status"
          element={
            <ProtectedRoute>
              <ApplicationStatus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/apply/waiting"
          element={
            <ProtectedRoute>
              <ApplicationWaiting />
            </ProtectedRoute>
          }
        />

        {/* Role-Based Dashboard Routes */}
        <Route
          path="/admin/*"
          element={
            <RoleBasedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/cafe/*"
          element={
            <RoleBasedRoute allowedRoles={["CAFE_OWNER", "ADMIN"]}>
              <CafeDashboard />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/user/*"
          element={
            <RoleBasedRoute allowedRoles={["USER", "ADMIN"]}>
              <UserDashboard />
            </RoleBasedRoute>
          }
        />

        {/* Redirect based on user role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* Support Ticket Detail Route - shared by admin and cafe owners */}
        <Route
          path="/support/tickets/:ticketId"
          element={
            <ProtectedRoute>
              <TicketDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </div>
  );
}

// Component to redirect users to their appropriate dashboard
function DashboardRedirect() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { userData, isLoading } = useUserSync(isSignedIn, user);

  useEffect(() => {
    // If user is not signed in, redirect to sign-in
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }

    // Use backend user data instead of Clerk metadata
    if (userData?.role && !isLoading) {
      const role = userData.role;

      switch (role) {
        case "ADMIN":
          window.location.href = "/admin";
          break;
        case "CAFE_OWNER":
          window.location.href = "/cafe";
          break;
        case "PENDING_CAFE":
          window.location.href = "/application-status";
          break;
        default:
          window.location.href = "/user";
      }
    }
  }, [isSignedIn, userData, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
      {userData?.role && (
        <p className="mt-4 text-muted-foreground">
          Redirecting to {userData.role.toLowerCase()} dashboard...
        </p>
      )}
    </div>
  );
}

export default App;
