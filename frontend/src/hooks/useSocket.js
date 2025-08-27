import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export function useSocket(enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!enabled || !isSignedIn) {
      // Disconnect if disabled or not signed in
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const connectSocket = async () => {
      try {
        const token = await getToken();

        if (!token) {
          console.warn("No auth token available for socket connection");
          return;
        }

        // Create socket connection
        const socket = io(SOCKET_URL, {
          auth: {
            token,
          },
          transports: ["websocket", "polling"],
          timeout: 10000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        // Connection event handlers
        socket.on("connect", () => {
          console.log("✅ Socket connected");
          setIsConnected(true);
          setConnectionError(null);
        });

        socket.on("connected", (data) => {
          console.log("🎉 Socket authenticated:", data);
        });

        socket.on("disconnect", (reason) => {
          console.log("🔌 Socket disconnected:", reason);
          setIsConnected(false);

          if (reason === "io server disconnect") {
            // Server disconnected, try to reconnect manually
            socket.connect();
          }
        });

        socket.on("connect_error", (error) => {
          console.error("❌ Socket connection error:", error);
          setConnectionError(error.message);
          setIsConnected(false);
        });

        // Real-time event handlers
        socket.on("notification:new", (data) => {
          console.log("📢 New notification:", data);
          const notification = data.data;

          toast.success(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        });

        socket.on("application:approved", (data) => {
          console.log("✅ Application approved:", data);
          toast.success("Application Approved!", {
            description: `Your café "${data.data.cafeName}" has been approved.`,
            duration: 6000,
          });

          // Redirect to cafe dashboard after a delay
          setTimeout(() => {
            window.location.href = "/cafe";
          }, 2000);
        });

        socket.on("application:rejected", (data) => {
          console.log("❌ Application rejected:", data);
          toast.error("Application Rejected", {
            description: `Your café application has been rejected. ${
              data.data.adminNotes || ""
            }`,
            duration: 8000,
          });
        });

        socket.on("role:updated", (data) => {
          console.log("👤 Role updated:", data);
          toast.success("Role Updated", {
            description: `Your role has been updated to ${data.data.newRole}`,
            duration: 5000,
          });

          // Refresh page to update UI based on new role
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        });

        socket.on("status:updated", (data) => {
          console.log("🔄 Status updated:", data);
          const message = data.data.isActive
            ? "Account Reactivated"
            : "Account Deactivated";
          const type = data.data.isActive ? "success" : "error";

          toast[type](message, {
            description: `Your account has been ${
              data.data.isActive ? "reactivated" : "deactivated"
            }`,
            duration: 6000,
          });
        });

        socket.on("support:message", (data) => {
          console.log("💬 Support message:", data);
          toast.success("New Support Message", {
            description: `New message in ticket #${data.ticketId}`,
            duration: 4000,
          });
        });

        socket.on("error", (error) => {
          console.error("🔥 Socket error:", error);
          toast.error("Connection Error", {
            description: error.message || "Socket connection error",
            duration: 4000,
          });
        });

        // Ping/pong for connection health
        const pingInterval = setInterval(() => {
          if (socket.connected) {
            socket.emit("ping");
          }
        }, 30000); // Ping every 30 seconds

        socket.on("pong", () => {
          // Connection is healthy
        });

        return () => {
          clearInterval(pingInterval);
          socket.disconnect();
        };
      } catch (error) {
        console.error("Failed to connect socket:", error);
        setConnectionError(error.message);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, isSignedIn, getToken]);

  // Socket utility functions
  const emit = (event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("Socket not connected, cannot emit event:", event);
    }
  };

  const on = (event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  };

  const off = (event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  };

  const joinRoom = (room) => {
    emit("join:room", { room });
  };

  const leaveRoom = (room) => {
    emit("leave:room", { room });
  };

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
  };
}
