import express from "express";
import { ZodError } from "zod";

// 404 handler
export const notFoundHandler = (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404,
  });
};

// Error handler
export const errorHandler = (
  err: Error,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error("Error:", err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid request data",
      details: err.errors,
      statusCode: 400,
    });
  }

  // Axios errors (API calls)
  if (err.name === "AxiosError") {
    const axiosError = err as any;
    const status = axiosError.response?.status || 500;
    const message = axiosError.response?.data?.error?.message || "External API error";

    return res.status(status >= 500 ? 500 : status).json({
      error: "API Error",
      message,
      statusCode: status >= 500 ? 500 : status,
    });
  }

  // Default error
  const status = (err as any).status || (err as any).statusCode || 500;
  return res.status(status).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    statusCode: status,
  });
};
