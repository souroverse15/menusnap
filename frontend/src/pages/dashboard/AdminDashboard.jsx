import { Routes, Route, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { adminApi, supportApi } from "@/lib/api";
import toast from "react-hot-toast";

// Components
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// Icons
import {
  LayoutDashboard,
  Store,
  Users,
  MessageSquare,
  Code,
  Bell,
  TrendingUp,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery(
    ["admin-dashboard"],
    async () => {
      const token = await getToken({ skipCache: true });
      return adminApi.getDashboard(token);
    },
    {
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => {
        console.error("Failed to fetch dashboard data:", error);
      },
    }
  );

  const navigation = [
    { name: "Overview", id: "overview", icon: LayoutDashboard },
    { name: "Café Management", id: "cafes", icon: Store },
    { name: "User Management", id: "users", icon: Users },
    { name: "Support", id: "support", icon: MessageSquare },
    { name: "Developers", id: "developers", icon: Code },
  ];

  // Generate dynamic stats from dashboard data
  const stats = dashboardData?.data?.stats
    ? [
        {
          title: "Total Users",
          value:
            dashboardData.data.stats.users?.total_users?.toLocaleString() ||
            "0",
          change: dashboardData.data.stats.growth?.userGrowth || null,
          changeType: dashboardData.data.stats.growth?.userGrowthType || null,
          icon: Users,
        },
        {
          title: "Active Cafés",
          value:
            dashboardData.data.stats.cafes?.active_cafes?.toLocaleString() ||
            "0",
          change: dashboardData.data.stats.growth?.cafeGrowth || null,
          changeType: dashboardData.data.stats.growth?.cafeGrowthType || null,
          icon: Store,
        },
        {
          title: "Pending Applications",
          value:
            dashboardData.data.stats.applications?.pendingCount?.toLocaleString() ||
            "0",
          change: dashboardData.data.stats.growth?.applicationGrowth || null,
          changeType:
            dashboardData.data.stats.growth?.applicationGrowthType || null,
          icon: Clock,
        },
        {
          title: "Support Tickets",
          value:
            dashboardData.data.stats.support?.open_tickets?.toLocaleString() ||
            "0",
          change: dashboardData.data.stats.growth?.supportGrowth || null,
          changeType:
            dashboardData.data.stats.growth?.supportGrowthType || null,
          icon: MessageSquare,
        },
      ]
    : [
        {
          title: "Total Users",
          value: "0",
          change: null,
          changeType: null,
          icon: Users,
        },
        {
          title: "Active Cafés",
          value: "0",
          change: null,
          changeType: null,
          icon: Store,
        },
        {
          title: "Pending Applications",
          value: "0",
          change: null,
          changeType: null,
          icon: Clock,
        },
        {
          title: "Support Tickets",
          value: "0",
          change: null,
          changeType: null,
          icon: MessageSquare,
        },
      ];

  // Use dynamic recent applications from dashboard data
  const recentApplications = dashboardData?.data?.recentApplications || [];

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: "warning",
      UNDER_REVIEW: "info",
      APPROVED: "success",
      REJECTED: "destructive",
    };
    return variants[status] || "secondary";
  };

  return (
    <DashboardLayout
      user={user}
      navigation={navigation}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title="Admin Dashboard"
      notifications={[]} // TODO: Implement notifications
    >
      <Routes>
        <Route
          path="/"
          element={
            <OverviewTab
              stats={stats}
              recentApplications={recentApplications}
              getStatusBadge={getStatusBadge}
              isLoading={dashboardLoading}
              error={dashboardError}
            />
          }
        />
        <Route path="/cafes" element={<CafeManagementTab />} />
        <Route path="/users" element={<UserManagementTab />} />
        <Route path="/support" element={<SupportTab />} />
        <Route path="/developers" element={<DevelopersTab />} />
      </Routes>
    </DashboardLayout>
  );
}

function OverviewTab({
  stats,
  recentApplications,
  getStatusBadge,
  isLoading,
  error,
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load dashboard data</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              {stat.change && (
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
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Café Applications</CardTitle>
          <CardDescription>Latest applications awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentApplications.map((application) => (
              <div
                key={application.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{application.cafeName}</h4>
                  <p className="text-sm text-muted-foreground">
                    by {application.applicant}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">{application.plan}</Badge>
                  <Badge variant={getStatusBadge(application.status)}>
                    {application.status.replace("_", " ")}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(application.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CafeManagementTab() {
  const { getToken } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Fetch cafe applications
  const {
    data: applicationsData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["admin-applications", selectedStatus],
    async () => {
      const token = await getToken({ skipCache: true });
      const params = {};
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }
      return adminApi.getApplications(params, token);
    },
    {
      retry: 2,
      staleTime: 1 * 60 * 1000, // 1 minute
      onError: (error) => {
        console.error("Failed to fetch applications:", error);
      },
    }
  );

  const applications = applicationsData?.data?.applications || [];
  const pagination = applicationsData?.data?.pagination || {};

  const handleApprove = async (applicationId) => {
    try {
      const token = await getToken({ skipCache: true });
      await adminApi.approveApplication(
        applicationId,
        { adminNotes: "Approved by admin" },
        token
      );
      toast.success("Application approved successfully!");
      refetch();
    } catch (error) {
      console.error("Failed to approve application:", error);
      toast.error("Failed to approve application. Please try again.");
    }
  };

  const handleReject = async (applicationId) => {
    try {
      const token = await getToken({ skipCache: true });
      await adminApi.rejectApplication(
        applicationId,
        { adminNotes: "Rejected by admin" },
        token
      );
      toast.success("Application rejected successfully!");
      refetch();
    } catch (error) {
      console.error("Failed to reject application:", error);
      toast.error("Failed to reject application. Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: "warning",
      UNDER_REVIEW: "info",
      APPROVED: "success",
      REJECTED: "destructive",
    };
    return variants[status] || "secondary";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Store className="mr-2 h-5 w-5" />
            Café Applications
          </CardTitle>
          <CardDescription>Review and manage café applications</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6">
            {[
              { id: "all", label: "All" },
              { id: "PENDING", label: "Pending" },
              { id: "UNDER_REVIEW", label: "Under Review" },
              { id: "APPROVED", label: "Approved" },
              { id: "REJECTED", label: "Rejected" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={selectedStatus === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Failed to load applications
              </h3>
              <p className="text-muted-foreground mb-4">
                {error.message || "Something went wrong"}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {/* Applications List */}
          {!isLoading && !error && (
            <>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No applications found
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedStatus === "all"
                      ? "No café applications have been submitted yet."
                      : `No ${selectedStatus.toLowerCase()} applications found.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id} className="border-l-4 border-l-rose-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold">
                                {app.cafe_name}
                              </h3>
                              <Badge variant={getStatusBadge(app.status)}>
                                {app.status}
                              </Badge>
                              <Badge variant="outline">{app.plan_type}</Badge>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>
                                <strong>Applicant:</strong>{" "}
                                {app.users?.first_name} {app.users?.last_name} (
                                {app.users?.email})
                              </p>
                              <p>
                                <strong>Contact:</strong> {app.email} |{" "}
                                {app.phone}
                              </p>
                              <p>
                                <strong>Address:</strong> {app.address},{" "}
                                {app.city}, {app.postal_code}
                              </p>
                              <p>
                                <strong>Submitted:</strong>{" "}
                                {formatDate(app.created_at)}
                              </p>
                              {app.cafe_description && (
                                <p>
                                  <strong>Description:</strong>{" "}
                                  {app.cafe_description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {(app.status === "PENDING" ||
                            app.status === "UNDER_REVIEW") && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(app.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(app.id)}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Pagination Info */}
                  {pagination.totalCount > 0 && (
                    <div className="text-center text-sm text-muted-foreground pt-4">
                      Showing {applications.length} of {pagination.totalCount}{" "}
                      applications
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserManagementTab() {
  const { getToken } = useAuth();
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["admin-users", selectedRole, selectedStatus, searchTerm],
    async () => {
      const token = await getToken({ skipCache: true });
      const params = {};
      if (selectedRole !== "all") params.role = selectedRole;
      if (selectedStatus !== "all")
        params.isActive = selectedStatus === "active";
      if (searchTerm) params.search = searchTerm;
      return adminApi.getUsers(params, token);
    },
    {
      retry: 2,
      staleTime: 1 * 60 * 1000, // 1 minute
      onError: (error) => {
        console.error("Failed to fetch users:", error);
      },
    }
  );

  const users = usersData?.data?.users || [];
  const pagination = usersData?.data?.pagination || {};

  const handleDeleteUser = async (userId, userEmail) => {
    if (
      !confirm(
        `Are you sure you want to delete user ${userEmail}? This will permanently delete all their data including cafes, applications, and orders.`
      )
    ) {
      return;
    }

    try {
      const token = await getToken({ skipCache: true });
      await adminApi.deleteUser(userId, token);
      toast.success("User deleted successfully!");
      refetch();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user. Please try again.");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const token = await getToken({ skipCache: true });
      await adminApi.updateUserRole(userId, { role: newRole }, token);
      toast.success("User role updated successfully!");
      refetch();
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast.error("Failed to update user role. Please try again.");
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      ADMIN: "destructive",
      CAFE_OWNER: "default",
      USER: "secondary",
      PENDING_CAFE: "warning",
    };
    return variants[role] || "secondary";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex space-x-2">
              {[
                { id: "all", label: "All Roles" },
                { id: "ADMIN", label: "Admin" },
                { id: "CAFE_OWNER", label: "Cafe Owner" },
                { id: "USER", label: "User" },
                { id: "PENDING_CAFE", label: "Pending" },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedRole === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRole(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <div className="flex space-x-2">
              {[
                { id: "all", label: "All Status" },
                { id: "active", label: "Active" },
                { id: "inactive", label: "Inactive" },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedStatus === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load users</p>
              <Button onClick={() => refetch()} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Users Table */}
          {!isLoading && !error && (
            <div className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">{user.fullName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                            {user.cafe && (
                              <p className="text-xs text-blue-600">
                                Cafe: {user.cafe.name} ({user.cafe.plan} plan)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge variant={getRoleBadge(user.role)}>
                          {user.role.replace("_", " ")}
                        </Badge>

                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>

                        <span className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </span>

                        <div className="flex space-x-2">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleUpdateRole(user.id, e.target.value)
                            }
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="USER">User</option>
                            <option value="CAFE_OWNER">Cafe Owner</option>
                            <option value="ADMIN">Admin</option>
                          </select>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDeleteUser(user.id, user.email)
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SupportTab() {
  const { getToken } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");

  // Fetch support tickets
  const {
    data: ticketsData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["admin-support-tickets", selectedStatus, selectedPriority],
    async () => {
      const token = await getToken({ skipCache: true });
      const params = {};
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (selectedPriority !== "all") params.priority = selectedPriority;
      return supportApi.getTickets(params, token);
    },
    {
      retry: 2,
      staleTime: 1 * 60 * 1000, // 1 minute
      onError: (error) => {
        console.error("Failed to fetch support tickets:", error);
      },
    }
  );

  // Fetch support statistics
  const { data: statsData, isLoading: statsLoading } = useQuery(
    ["admin-support-stats"],
    async () => {
      const token = await getToken({ skipCache: true });
      return supportApi.getStats(token);
    },
    {
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => {
        console.error("Failed to fetch support stats:", error);
      },
    }
  );

  const tickets = ticketsData?.data?.tickets || [];
  const stats = statsData?.data || {};

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      const token = await getToken({ skipCache: true });
      await supportApi.updateTicketStatus(
        ticketId,
        { status: newStatus },
        token
      );
      toast.success("Ticket status updated!");
      refetch();
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast.error("Failed to update status. Please try again.");
    }
  };

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
      {/* Statistics Cards */}
      {!statsLoading && stats.statusCounts && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                  <p className="text-2xl font-bold">
                    {stats.statusCounts.OPEN || 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">
                    {stats.statusCounts.IN_PROGRESS || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">
                    {stats.statusCounts.RESOLVED || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tickets</p>
                  <p className="text-2xl font-bold">
                    {stats.totalTickets || 0}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Support Tickets Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Support Tickets
          </CardTitle>
          <CardDescription>
            Manage customer support requests and inquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex space-x-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
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
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No support tickets found
                  </p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{ticket.subject}</h4>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>by {ticket.author?.name}</span>
                        <span>{formatDate(ticket.createdAt)}</span>
                        {ticket.messageCount > 0 && (
                          <span>{ticket.messageCount} messages</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant={getStatusBadge(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>

                      <div className="flex space-x-1">
                        <Link to={`/support/tickets/${ticket.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        {ticket.status !== "OPEN" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(ticket.id, "OPEN")
                            }
                          >
                            Open
                          </Button>
                        )}
                        {ticket.status !== "IN_PROGRESS" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(ticket.id, "IN_PROGRESS")
                            }
                          >
                            In Progress
                          </Button>
                        )}
                        {ticket.status !== "RESOLVED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(ticket.id, "RESOLVED")
                            }
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DevelopersTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="mr-2 h-5 w-5" />
            Developer Tools
          </CardTitle>
          <CardDescription>
            Manage developer accounts and assign roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Code className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Developer Tools Coming Soon
            </h3>
            <p className="text-muted-foreground">
              This section will allow you to manage developer accounts and
              assign limited admin rights.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
