import type { CorsConfig } from "../types";

/**
 * CORS middleware helper
 */
export const createCorsMiddleware = (config: CorsConfig) => {
  const {
    origin = "*",
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials = false,
    maxAge = 86400,
    allowedHeaders = ["Content-Type", "Authorization"],
    exposedHeaders = [],
  } = config;

  return async (context: any) => {
    const { request, set } = context;
    const requestOrigin = request.headers.get("origin");

    // Check origin
    let allowOrigin = "*";
    if (typeof origin === "string") {
      allowOrigin = origin;
    } else if (Array.isArray(origin)) {
      if (requestOrigin && origin.includes(requestOrigin)) {
        allowOrigin = requestOrigin;
      } else {
        allowOrigin = origin[0] || "*";
      }
    } else if (typeof origin === "function") {
      if (requestOrigin && origin(requestOrigin)) {
        allowOrigin = requestOrigin;
      }
    }

    // Set CORS headers
    set.headers["Access-Control-Allow-Origin"] = allowOrigin;
    set.headers["Access-Control-Allow-Methods"] = methods.join(", ");
    set.headers["Access-Control-Allow-Headers"] = allowedHeaders.join(", ");

    if (credentials) {
      set.headers["Access-Control-Allow-Credentials"] = "true";
    }

    if (maxAge) {
      set.headers["Access-Control-Max-Age"] = String(maxAge);
    }

    if (exposedHeaders.length > 0) {
      set.headers["Access-Control-Expose-Headers"] = exposedHeaders.join(", ");
    }

    // Handle preflight
    if (request.method === "OPTIONS") {
      set.status = 204;
      return; // Just return void for Elysia
    }
  };
};
