import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "dotenv";
import { RateLimiterMemory } from "rate-limiter-flexible";

import routes from "./routes.js";
import { errorHandler, notFoundHandler } from "./middleware.js";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5174;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_POINTS || "100", 10),
  duration: parseInt(process.env.RATE_LIMIT_DURATION || "60", 10),
});

const rateLimitMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    await rateLimiter.consume(req.ip || "default");
    next();
  } catch (rejRes) {
    const secs = Math.round((rejRes as any).msBeforeNext / 1000) || 1;
    res.set("Retry-After", String(secs));
    res.status(429).json({
      error: "Too Many Requests",
      message: `Rate limit exceeded. Try again in ${secs} seconds.`,
      statusCode: 429,
    });
  }
};

// Apply rate limiting to API routes
app.use("/api", rateLimitMiddleware);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Request timeout
app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({
      error: "Request Timeout",
      message: "Request took too long to complete",
      statusCode: 408,
    });
  });
  next();
});

// API routes
app.use("/api", routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 TubeTrack server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 CORS origin: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

export default app;
