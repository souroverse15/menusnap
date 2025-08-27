import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Shield,
} from "lucide-react";

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
import { supportApi } from "@/lib/api";

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const { getToken, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);

  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [backPath, setBackPath] = useState("/dashboard"); // Store the back navigation path

  const isStaff = ["ADMIN", "DEV", "MOD"].includes(user?.publicMetadata?.role);
  const userRole = user?.publicMetadata?.role;

  // Set the correct back path when user data loads
  useEffect(() => {
    if (user?.publicMetadata?.role) {
      const role = user.publicMetadata.role;
      console.log("Setting back path for role:", role);

      if (role === "ADMIN") {
        setBackPath("/admin/support");
      } else if (role === "CAFE_OWNER") {
        setBackPath("/cafe/support");
      } else {
        setBackPath("/dashboard");
      }
    }
  }, [user]);

  // Helper function to navigate back to appropriate support page
  const navigateToSupport = () => {
    console.log("Navigating back to:", backPath);
    console.log("Current user state:", user ? "loaded" : "undefined");

    // If we still don't have a proper back path, use browser back as fallback
    if (backPath === "/dashboard" && !user) {
      console.log("Using browser back as fallback");
      window.history.back();
    } else {
      navigate(backPath);
    }
  };

  // Fetch ticket details
  const {
    data: ticketData,
    isLoading,
    error,
  } = useQuery(
    ["support-ticket", ticketId],
    async () => {
      const token = await getToken({ skipCache: true });
      return supportApi.getTicket(ticketId, token);
    },
    {
      retry: 2,
      refetchInterval: 5000, // Poll every 5 seconds for new messages
      onError: (error) => {
        console.error("Failed to fetch ticket:", error);
        if (error.response?.status === 404) {
          toast.error("Ticket not found");
          navigateToSupport();
        } else if (error.response?.status === 403) {
          toast.error("Access denied");
          navigateToSupport();
        }
      },
    }
  );

  // Add message mutation
  const addMessageMutation = useMutation(
    async (data) => {
      const token = await getToken({ skipCache: true });
      return supportApi.addMessage(ticketId, data, token);
    },
    {
      onSuccess: () => {
        setNewMessage("");
        setIsInternal(false);
        queryClient.invalidateQueries(["support-ticket", ticketId]);
        toast.success("Message sent!");
      },
      onError: (error) => {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message. Please try again.");
      },
    }
  );

  // Update status mutation (staff only)
  const updateStatusMutation = useMutation(
    async (status) => {
      const token = await getToken({ skipCache: true });
      return supportApi.updateTicketStatus(ticketId, { status }, token);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["support-ticket", ticketId]);
        toast.success("Status updated!");
      },
      onError: (error) => {
        console.error("Failed to update status:", error);
        toast.error("Failed to update status. Please try again.");
      },
    }
  );

  const ticket = ticketData?.data?.ticket;
  const messages = ticketData?.data?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (ticket?.status === "RESOLVED" && !isStaff) {
      toast.error("Cannot reply to resolved tickets");
      return;
    }

    addMessageMutation.mutate({
      message: newMessage.trim(),
      isInternal: isInternal && isStaff,
    });
  };

  const handleStatusUpdate = (status) => {
    updateStatusMutation.mutate(status);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8 text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load ticket</p>
            <Button onClick={navigateToSupport} className="mt-2">
              Back to Support
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={navigateToSupport}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {ticket.subject}
            </h1>
            <p className="text-gray-500 text-sm">
              Created {formatDate(ticket.createdAt)} by {ticket.author?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={getPriorityBadge(ticket.priority)}>
            {ticket.priority}
          </Badge>
          <Badge variant={getStatusBadge(ticket.status)}>
            {getStatusIcon(ticket.status)}
            <span className="ml-1">{ticket.status.replace("_", " ")}</span>
          </Badge>
        </div>
      </div>

      {/* Staff Actions */}
      {isStaff && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Staff Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              {ticket.status !== "OPEN" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("OPEN")}
                  disabled={updateStatusMutation.isLoading}
                >
                  Mark as Open
                </Button>
              )}
              {ticket.status !== "IN_PROGRESS" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("IN_PROGRESS")}
                  disabled={updateStatusMutation.isLoading}
                >
                  Mark as In Progress
                </Button>
              )}
              {ticket.status !== "RESOLVED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("RESOLVED")}
                  disabled={updateStatusMutation.isLoading}
                >
                  Mark as Resolved
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender?.email ===
                  user?.emailAddresses?.[0]?.emailAddress
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender?.email ===
                    user?.emailAddresses?.[0]?.emailAddress
                      ? "bg-rose-600 text-white"
                      : message.isInternal
                      ? "bg-yellow-100 border border-yellow-300"
                      : "bg-gray-100"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender?.isStaff ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">
                      {message.sender?.name}
                    </span>
                    {message.isInternal && (
                      <Badge variant="warning" className="text-xs">
                        Internal
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {message.message}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {formatDate(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {(ticket.status !== "RESOLVED" || isStaff) && (
        <Card>
          <CardHeader>
            <CardTitle>Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md text-sm resize-vertical"
                disabled={addMessageMutation.isLoading}
              />

              <div className="flex items-center justify-between">
                {isStaff && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Internal message (staff only)
                    </span>
                  </label>
                )}

                <Button
                  type="submit"
                  disabled={addMessageMutation.isLoading || !newMessage.trim()}
                  className="ml-auto"
                >
                  {addMessageMutation.isLoading && (
                    <LoadingSpinner size="sm" className="mr-2" />
                  )}
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {ticket.status === "RESOLVED" && !isStaff && (
        <Card className="mt-6">
          <CardContent className="text-center py-6">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-gray-600">
              This ticket has been resolved. If you need further assistance,
              please create a new ticket.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
