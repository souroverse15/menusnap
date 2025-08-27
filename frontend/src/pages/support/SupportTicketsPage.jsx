import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { supportApi } from "@/lib/api";

export default function SupportTicketsPage() {
  const { getToken, user } = useAuth();
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
  });

  const {
    data: ticketsData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["support-tickets", filters],
    async () => {
      const token = await getToken({ skipCache: true });
      return supportApi.getTickets(filters, token);
    },
    {
      retry: 2,
      staleTime: 1 * 60 * 1000, // 1 minute
      onError: (error) => {
        console.error("Failed to fetch tickets:", error);
      },
    }
  );

  const tickets = ticketsData?.data?.tickets || [];
  const pagination = ticketsData?.data?.pagination || {};

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-2">
            View and manage your support tickets
          </p>
        </div>
        <Button asChild>
          <Link to="/support/new">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-8 text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load tickets</p>
            <Button onClick={() => refetch()} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No support tickets yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first support ticket to get help from our team.
                </p>
                <Button asChild>
                  <Link to="/support/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(ticket.status)}
                        <Link
                          to={`/support/tickets/${ticket.id}`}
                          className="text-lg font-medium text-gray-900 hover:text-rose-600"
                        >
                          {ticket.subject}
                        </Link>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span>Created {formatDate(ticket.createdAt)}</span>
                        {ticket.messageCount > 0 && (
                          <span className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {ticket.messageCount} messages
                          </span>
                        )}
                        {ticket.author && <span>by {ticket.author.name}</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant={getPriorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant={getStatusBadge(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {pagination.hasPrev && (
                  <Button variant="outline">Previous</Button>
                )}
                <span className="px-3 py-2 text-sm text-gray-500">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                {pagination.hasNext && <Button variant="outline">Next</Button>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
