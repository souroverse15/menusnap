import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

// Components
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Icons
import {
  Coffee,
  Clock,
  CheckCircle,
  Mail,
  Phone,
  ArrowLeft,
} from "lucide-react";

// Hooks
import { useSocket } from "@/hooks/useSocket";

export default function ApplicationWaiting() {
  const { user } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState("PENDING");
  const { isConnected, on, off } = useSocket(true);

  useEffect(() => {
    // Listen for application approval
    const handleApplicationApproved = (data) => {
      console.log("🎉 Application approved:", data);
      setApplicationStatus("APPROVED");

      // Redirect to cafe dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/cafe";
      }, 3000);
    };

    const handleApplicationRejected = (data) => {
      console.log("❌ Application rejected:", data);
      setApplicationStatus("REJECTED");
    };

    // Set up socket listeners
    if (isConnected) {
      on("application:approved", handleApplicationApproved);
      on("application:rejected", handleApplicationRejected);
    }

    // Cleanup
    return () => {
      if (isConnected) {
        off("application:approved", handleApplicationApproved);
        off("application:rejected", handleApplicationRejected);
      }
    };
  }, [isConnected, on, off]);

  if (applicationStatus === "APPROVED") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Application Approved!
              </CardTitle>
              <CardDescription>
                Congratulations! Your café has been approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                You're being redirected to your café dashboard...
              </p>
              <LoadingSpinner size="md" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (applicationStatus === "REJECTED") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Coffee className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                Application Not Approved
              </CardTitle>
              <CardDescription>
                Unfortunately, your application was not approved at this time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Please contact our support team for more information about
                reapplying.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <a href="mailto:support@menusnap.com">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Support
                  </a>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-rose-600" />
              <span className="text-xl font-bold gradient-text">MenuSnap</span>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                <span className="text-sm font-medium text-rose-600">
                  {user?.firstName?.[0] || "U"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Application Under Review
          </h1>
          <p className="text-xl text-muted-foreground">
            Thank you for submitting your café application! Our team is
            currently reviewing your submission.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Application Status
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    Under Review
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Submitted</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expected Response</span>
                  <span className="text-sm text-muted-foreground">
                    1-2 business days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next Card */}
          <Card>
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Our team reviews your application details</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>We may contact you for additional information</span>
                </li>
                <li className="flex items-start">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    You'll receive an email notification with our decision
                  </span>
                </li>
                <li className="flex items-start">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    If approved, you'll gain access to your café dashboard
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Real-time Updates Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                Real-time Updates
                {isConnected && (
                  <span className="ml-2 text-sm font-normal text-green-600">
                    Connected
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                This page will automatically update when your application status
                changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  Stay on this page for instant updates
                </h4>
                <p className="text-sm text-blue-700">
                  When your application is approved, you'll be automatically
                  redirected to your café dashboard. No need to refresh the page
                  or check your email constantly!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Our support team is here to assist you during the review
                process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" asChild>
                  <a href="mailto:support@menusnap.com">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Support
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="tel:+1-555-MENU-SNAP">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Support
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/application-status">
                    View Full Application Status
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
