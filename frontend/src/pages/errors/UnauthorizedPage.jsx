import { Link } from "react-router-dom";
import { Coffee, Shield, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50 px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Coffee className="h-10 w-10 text-rose-600" />
          <span className="text-2xl font-bold gradient-text">MenuSnap</span>
        </div>

        {/* Unauthorized Error */}
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-10 w-10 text-red-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Unauthorized Access
          </h2>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. This could be
            because:
          </p>

          <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
            <li>• You don't have the required role or permissions</li>
            <li>• Your account is pending approval</li>
            <li>• Your session has expired</li>
            <li>• The page requires a different access level</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>

          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            Think this is a mistake?{" "}
            <a
              href="mailto:support@menusnap.com"
              className="text-rose-600 hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
