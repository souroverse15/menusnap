import { verifyToken } from "@clerk/express";
import { supabase } from "../config/supabase.js";
import { ROLES } from "../constants/plans.js";

// Socket.io authentication middleware
export const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify Clerk token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload || !payload.sub) {
      return next(new Error("Invalid authentication token"));
    }

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", payload.sub)
      .eq("is_active", true)
      .single();

    if (error || !user) {
      return next(new Error("User not found or inactive"));
    }

    // Attach user to socket
    socket.userId = user.id;
    socket.userRole = user.role;
    socket.userEmail = user.email;
    socket.clerkId = user.clerk_id;
    socket.user = user;

    // Join user to their personal room
    socket.join(`user:${user.id}`);

    // Join role-based rooms
    socket.join(`role:${user.role}`);

    // If admin, join admin room
    if (user.role === ROLES.ADMIN) {
      socket.join("admin");
    }

    // If cafe owner, join cafe owner room
    if (user.role === ROLES.CAFE_OWNER) {
      socket.join("cafe_owners");

      // Join specific cafe room if they own a cafe
      const { data: cafes, error: cafeError } = await supabase
        .from("cafes")
        .select("id")
        .eq("owner_id", user.id)
        .eq("is_active", true);

      if (!cafeError && cafes && cafes.length > 0) {
        cafes.forEach((cafe) => {
          socket.join(`cafe:${cafe.id}`);
        });
      }
    }

    console.log(`✅ Socket authenticated: ${user.email} (${user.role})`);
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
};

// Middleware to check if socket user has required role
export const requireSocketRole = (allowedRoles) => {
  return (socket, next) => {
    if (!socket.userRole || !allowedRoles.includes(socket.userRole)) {
      return next(new Error("Insufficient permissions"));
    }
    next();
  };
};

// Middleware to check if socket user is admin
export const requireSocketAdmin = requireSocketRole([ROLES.ADMIN]);

// Middleware to check if socket user is cafe owner or admin
export const requireSocketCafeOwner = requireSocketRole([
  ROLES.CAFE_OWNER,
  ROLES.ADMIN,
]);
