import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "react-query";
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
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Icons
import {
  Coffee,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  FileText,
  ArrowLeft,
} from "lucide-react";

// API
import { cafeApi } from "@/lib/api";
import { formatDateTime, getStatusBadgeColor } from "@/lib/utils";

export default function ApplicationStatus() {
  const { getToken } = useAuth();
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch application status
  const {
    data: applicationData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    "my-application",
    async () => {
      const token = await getToken();
      return cafeApi.getMyApplication(token);
    },
    {
      refetchInterval: refreshInterval,
      refetchOnWindowFocus: true,
      onSuccess: (data) => {
        // Stop polling if application is approved or rejected
        const status = data?.data?.application?.status;
        if (status === "APPROVED" || status === "REJECTED") {
          setRefreshInterval(false);
        }
      },
    }
  );

  const application = applicationData?.data?.application;

  // Handle real-time updates
  useEffect(() => {
    // Listen for application status changes
    const handleStorageChange = (e) => {
      if (e.key === "application-status-update") {
        refetch();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refetch]);

  const getStatusInfo = (status) => {
    switch (status) {
      case "PENDING":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          title: "Application Under Review",
          description:
            "Your application is being reviewed by our team. This typically takes 1-2 business days.",
        };
      case "UNDER_REVIEW":
        return {
          icon: AlertCircle,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          title: "Additional Review Required",
          description:
            "Our team is conducting additional review of your application. We may contact you for more information.",
        };
      case "APPROVED":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          title: "Application Approved!",
          description:
            "Congratulations! Your café has been approved. You can now access your dashboard and start setting up your menu.",
        };
      case "REJECTED":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          title: "Application Rejected",
          description:
            "Unfortunately, your application was not approved at this time. Please see the notes below for more information.",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          title: "Application Status Unknown",
          description:
            "We are unable to determine your application status at this time.",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">
            Loading your application status...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <XCircle className="mr-2 h-5 w-5" />
              Error Loading Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We couldn't load your application status. This might be because:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-4">
              <li>• You haven't submitted an application yet</li>
              <li>• There was a network error</li>
              <li>• Your session has expired</li>
            </ul>
            <div className="flex space-x-2">
              <Button onClick={() => refetch()}>Try Again</Button>
              <Button variant="outline" asChild>
                <Link to="/apply">Submit Application</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <Card className="max-w-md text-center">
          <CardHeader>
            <Coffee className="mx-auto h-12 w-12 text-rose-600 mb-4" />
            <CardTitle>No Application Found</CardTitle>
            <CardDescription>
              You haven't submitted a café application yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/apply">Start Your Application</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(application.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-rose-600" />
              <span className="text-2xl font-bold gradient-text">MenuSnap</span>
            </div>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="overflow-hidden">
            <div className={`${statusInfo.bgColor} px-6 py-4`}>
              <div className="flex items-center">
                <statusInfo.icon
                  className={`h-8 w-8 ${statusInfo.color} mr-3`}
                />
                <div>
                  <h1 className={`text-2xl font-bold ${statusInfo.color}`}>
                    {statusInfo.title}
                  </h1>
                  <p className="text-sm opacity-80">
                    Application ID: {application.id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                {statusInfo.description}
              </p>

              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    getStatusBadgeColor(application.status).includes("green")
                      ? "success"
                      : getStatusBadgeColor(application.status).includes(
                          "yellow"
                        )
                      ? "warning"
                      : getStatusBadgeColor(application.status).includes("red")
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {application.status.replace("_", " ")}
                </Badge>

                <div className="text-sm text-muted-foreground">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Submitted {formatDateTime(application.createdAt)}
                </div>
              </div>

              {/* Approved Actions */}
              {application.status === "APPROVED" && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">
                    Ready to get started?
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    Your café has been approved! You can now access your
                    dashboard and start building your digital menu.
                  </p>
                  <Button asChild>
                    <Link to="/cafe">Go to Dashboard</Link>
                  </Button>
                </div>
              )}

              {/* Admin Notes */}
              {application.adminNotes && (
                <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Notes from Review Team
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {application.adminNotes}
                  </p>
                  {application.reviewedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Reviewed on {formatDateTime(application.reviewedAt)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Café Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium">{application.cafeName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {application.cafeDescription || "No description provided"}
                  </p>
                </div>

                <div className="text-sm">
                  <p className="font-medium">Address:</p>
                  <p className="text-muted-foreground">
                    {application.address}
                    <br />
                    {application.city} {application.postalCode}
                  </p>
                </div>

                <div className="text-sm">
                  <p className="font-medium">Selected Plan:</p>
                  <Badge variant="outline">{application.planType}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{application.email}</span>
                </div>

                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{application.phone}</span>
                </div>

                {application.websiteUrl && (
                  <div className="text-sm">
                    <p className="font-medium">Website:</p>
                    <a
                      href={application.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline"
                    >
                      {application.websiteUrl}
                    </a>
                  </div>
                )}

                {application.businessLicense && (
                  <div className="text-sm">
                    <p className="font-medium">Business License:</p>
                    <p className="text-muted-foreground">
                      {application.businessLicense}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Have questions about your application or the review process?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Contact Support</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Our support team is here to help with any questions about
                    your application.
                  </p>
                  <Button variant="outline" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Support
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Review Process</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • Applications are reviewed within 1-2 business days
                    </li>
                    <li>• We may contact you for additional information</li>
                    <li>
                      • You'll receive email notifications for status updates
                    </li>
                    <li>• This page updates automatically</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
