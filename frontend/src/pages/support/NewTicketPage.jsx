import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { supportApi } from "@/lib/api";

export default function NewTicketPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "MEDIUM",
  });

  const createTicketMutation = useMutation(
    async (data) => {
      const token = await getToken({ skipCache: true });
      return supportApi.createTicket(data, token);
    },
    {
      onSuccess: (response) => {
        toast.success("Support ticket created successfully!");
        navigate(`/support/tickets/${response.data.ticket.id}`);
      },
      onError: (error) => {
        console.error("Failed to create ticket:", error);
        toast.error("Failed to create ticket. Please try again.");
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    createTicketMutation.mutate(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Create Support Ticket
        </h1>
        <p className="text-gray-600 mt-2">
          Need help? Create a support ticket and our team will get back to you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Support Request</CardTitle>
          <CardDescription>
            Please provide as much detail as possible to help us assist you
            better.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="Brief description of your issue"
                required
                maxLength={255}
              />
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Please describe your issue in detail..."
                required
                rows={6}
                maxLength={2000}
                className="w-full px-3 py-2 border border-input rounded-md text-sm resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={createTicketMutation.isLoading}
                className="flex-1"
              >
                {createTicketMutation.isLoading && (
                  <LoadingSpinner size="sm" className="mr-2" />
                )}
                Create Ticket
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/support")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
