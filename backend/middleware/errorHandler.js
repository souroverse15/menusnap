// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  // Clerk authentication errors
  if (err.name === "ClerkAPIError") {
    return res.status(401).json({
      error: "Authentication failed",
      message: "Invalid or expired authentication token",
    });
  }

  // Database connection errors
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return res.status(503).json({
      error: "Service unavailable",
      message: "Database connection failed",
    });
  }

  // PostgreSQL errors
  if (err.code && err.code.startsWith("23")) {
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Conflict",
        message: "Resource already exists",
      });
    }
    if (err.code === "23503") {
      return res.status(400).json({
        error: "Bad request",
        message: "Referenced resource does not exist",
      });
    }
    if (err.code === "23502") {
      return res.status(400).json({
        error: "Bad request",
        message: "Required field is missing",
      });
    }
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      message: err.message,
      details: err.details,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Authentication failed",
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Authentication failed",
      message: "Token expired",
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
    });
  }

  // File upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "File too large",
      message: "Uploaded file exceeds size limit",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      error: "Invalid file",
      message: "Unexpected file field",
    });
  }

  // Socket.io errors
  if (err.type === "SocketError") {
    console.error("Socket error:", err);
    return; // Don't send HTTP response for socket errors
  }

  // Default to 500 server error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal server error" : "Error",
    message:
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "Something went wrong"
        : message,
    ...(process.env.NODE_ENV === "development" &&
      statusCode === 500 && {
        stack: err.stack,
      }),
  });
};

// Async error handler wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
  });
};
