import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import cafeRoutes from "./routes/cafeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";

// Import middleware
import { requireAuthentication } from "./middleware/authMiddleware.js";
import { clerkMiddleware } from "@clerk/express";
import { errorHandler } from "./middleware/errorHandler.js";
import { socketAuth } from "./middleware/socketAuth.js";

// Import socket handlers
import { handleSocketConnection } from "./sockets/socketHandlers.js";

// Import database
import { initSupabase } from "./config/supabase.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(limiter);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Clerk middleware (required for authentication)
app.use(clerkMiddleware());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/cafe", cafeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/support", supportRoutes);

// Socket.io middleware and connection handling
io.use(socketAuth);
io.on("connection", (socket) => handleSocketConnection(io, socket));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize database and start server
async function startServer() {
  try {
    // Try to initialize database, but don't fail if it doesn't work
    try {
      await initSupabase();
      console.log("✅ Supabase initialized successfully");
    } catch (dbError) {
      console.warn(
        "⚠️ Supabase initialization failed, starting server anyway:",
        dbError.message
      );
      console.log("💡 Please check your Supabase credentials");
    }

    server.listen(PORT, () => {
      console.log(`🚀 MenuSnap Backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔌 Socket.io enabled`);
      console.log(`🌐 API available at: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

startServer();

export { io };
