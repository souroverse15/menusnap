import axios from "axios";
import { getApiUrl } from "./utils";

// Create axios instance
export const apiClient = axios.create({
  baseURL: getApiUrl(""),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Token will be added by individual components using Clerk's getToken()
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - redirect to sign in
          console.error("401 Unauthorized - redirecting to sign in");
          window.location.href = "/sign-in";
          break;
        case 403:
          // Forbidden - redirect to unauthorized page
          window.location.href = "/unauthorized";
          break;
        case 404:
          // Not found
          console.error("Resource not found:", error.config?.url);
          break;
        case 429:
          // Rate limited
          console.error("Rate limit exceeded");
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          console.error("Server error:", status);
          break;
      }

      return Promise.reject(data || error.response);
    } else if (error.request) {
      // Network error
      console.error("Network error:", error.message);
      return Promise.reject({
        error: "Network error",
        message: "Unable to connect to server. Please check your connection.",
      });
    } else {
      // Other error
      console.error("Request error:", error.message);
      return Promise.reject({
        error: "Request failed",
        message: error.message,
      });
    }
  }
);

// API service functions
export const authApi = {
  getCurrentUser: (token) =>
    apiClient.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateProfile: (data, token) =>
    apiClient.put("/auth/me", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  checkPermissions: (resource, action, token) =>
    apiClient.get(`/auth/permissions?resource=${resource}&action=${action}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export const cafeApi = {
  submitApplication: (data, token) =>
    apiClient.post("/cafe/apply", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMyApplication: (token) =>
    apiClient.get("/cafe/application", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateApplication: (applicationId, data, token) =>
    apiClient.put(`/cafe/application/${applicationId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getDashboard: (token) =>
    apiClient.get("/cafe/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateCafe: (cafeId, data, token) =>
    apiClient.put(`/cafe/${cafeId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export const adminApi = {
  getDashboard: (token) =>
    apiClient.get("/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getApplications: (params, token) =>
    apiClient.get("/admin/applications", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getApplication: (applicationId, token) =>
    apiClient.get(`/admin/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  approveApplication: (applicationId, data, token) =>
    apiClient.post(`/admin/applications/${applicationId}/approve`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  rejectApplication: (applicationId, data, token) =>
    apiClient.post(`/admin/applications/${applicationId}/reject`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getUsers: (params, token) =>
    apiClient.get("/admin/users", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateUserRole: (userId, data, token) =>
    apiClient.put(`/admin/users/${userId}/role`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteUser: (userId, token) =>
    apiClient.delete(`/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleUserStatus: (userId, data, token) =>
    apiClient.put(`/admin/users/${userId}/status`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getNotifications: (params, token) =>
    apiClient.get("/admin/notifications", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  markNotificationRead: (notificationId, token) =>
    apiClient.put(
      `/admin/notifications/${notificationId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),
};

export const notificationApi = {
  getNotifications: (params, token) =>
    apiClient.get("/notifications", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  getUnreadCount: (token) =>
    apiClient.get("/notifications/unread-count", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  markAsRead: (notificationId, token) =>
    apiClient.put(
      `/notifications/${notificationId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  markAllAsRead: (token) =>
    apiClient.put(
      "/notifications/mark-all-read",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  deleteNotification: (notificationId, token) =>
    apiClient.delete(`/notifications/${notificationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createNotification: (data, token) =>
    apiClient.post("/notifications", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Support API
export const supportApi = {
  // Create a new support ticket
  createTicket: (data, token) =>
    apiClient.post("/support/tickets", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Get all tickets (filtered by user role)
  getTickets: (params, token) =>
    apiClient.get("/support/tickets", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Get a specific ticket with messages
  getTicket: (ticketId, token) =>
    apiClient.get(`/support/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Add a message to a ticket
  addMessage: (ticketId, data, token) =>
    apiClient.post(`/support/tickets/${ticketId}/messages`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Update ticket status (staff only)
  updateTicketStatus: (ticketId, data, token) =>
    apiClient.put(`/support/tickets/${ticketId}/status`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Get support statistics (admin only)
  getStats: (token) =>
    apiClient.get("/support/stats", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
