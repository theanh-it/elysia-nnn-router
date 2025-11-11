import { Elysia } from "elysia";
import { join } from "path";
import { existsSync } from "fs";
import { scanRoutes } from "./scanner/route-scanner";
import type { NnnRouterPluginOptions } from "./types";
import {
  createErrorMessage,
  StatusResponse,
  RESPONSE_MESSAGE,
} from "./helpers/response";

// Re-export types for consumers
export type {
  NnnRouterPluginOptions,
  RouteSchema,
  SwaggerConfig,
} from "./types";

// Re-export response helpers for consumers
export {
  createSuccessMessage,
  createErrorMessage,
  createSuccessPaginate,
  serializeBigInt,
  StatusResponse,
  RESPONSE_MESSAGE,
} from "./helpers/response";
export type {
  InputCreateMessage,
  InputCreateSuccessPaginate,
} from "./helpers/response";

// Re-export security types
export type {
  ValidationError,
  RouteLoadError,
  ErrorContext,
  ErrorFormatter,
  ErrorHandlerConfig,
  RateLimitConfig,
  CorsConfig,
  SecurityHeadersConfig,
  SecurityConfig,
} from "./types";

const defaultPath = join(process.cwd(), "routes");

/**
 * NNN Router Plugin for Elysia
 *
 * Features:
 * - File-based routing with automatic route registration
 * - Zod/TypeBox schema validation with detailed error messages
 * - Optional Swagger documentation (set swagger.enabled = true)
 * - Directory-level middleware cascading
 * - Method-level middleware support
 * - Dynamic routes with [param] syntax
 *
 * @example
 * ```typescript
 * import { nnnRouterPlugin } from "elysia-nnn-router";
 *
 * // Minimal - 18KB bundle (no Swagger)
 * app.use(await nnnRouterPlugin({
 *   dir: "routes",
 *   prefix: "api"
 * }));
 *
 * // With Swagger - lazy-loaded
 * app.use(await nnnRouterPlugin({
 *   dir: "routes",
 *   prefix: "api",
 *   swagger: {
 *     enabled: true,  // ← Chỉ cần set true
 *     path: "/docs"
 *   }
 * }));
 * ```
 */
export const nnnRouterPlugin = async (options: NnnRouterPluginOptions = {}) => {
  const dir = options.dir ? join(process.cwd(), options.dir) : defaultPath;
  const prefix = options.prefix || "";
  const swaggerConfig = options.swagger;
  const errorConfig = options.errorHandling || {};
  const securityConfig = options.security || {};

  let app = new Elysia();

  // Apply security middlewares
  if (securityConfig.cors?.enabled) {
    try {
      const { createCorsMiddleware } = await import("./security/cors");
      app = app.derive(createCorsMiddleware(securityConfig.cors));
    } catch (error) {
      console.warn("⚠️  Failed to load CORS middleware");
    }
  }

  if (securityConfig.headers?.enabled) {
    try {
      const { createSecurityHeadersMiddleware } = await import(
        "./security/headers"
      );
      app = app.derive(createSecurityHeadersMiddleware(securityConfig.headers));
    } catch (error) {
      console.warn("⚠️  Failed to load security headers middleware");
    }
  }

  if (securityConfig.rateLimit?.enabled) {
    try {
      const { RateLimiter } = await import("./security/rate-limit");
      const limiter = new RateLimiter(securityConfig.rateLimit);
      app = app.derive(limiter.createMiddleware());
    } catch (error) {
      console.warn("⚠️  Failed to load rate limiting middleware");
    }
  }

  if (securityConfig.sanitizeInput) {
    try {
      const { createSanitizeMiddleware } = await import("./security/sanitize");
      app = app.derive(createSanitizeMiddleware());
    } catch (error) {
      console.warn("⚠️  Failed to load sanitization middleware");
    }
  }

  if (securityConfig.csrf) {
    try {
      const { createCsrfMiddleware } = await import("./security/csrf");
      app = app.derive(createCsrfMiddleware());
    } catch (error) {
      console.warn("⚠️  Failed to load CSRF middleware");
    }
  }

  // Custom error handler with configurable options
  app.onError(({ code, error, set, request, path: requestPath }) => {
    // Validation errors
    if (code === "VALIDATION") {
      set.status = 422;

      const validationErrors: { path: string; message: string; value?: any }[] =
        [];

      if (error && typeof error === "object" && "all" in error) {
        const errors = (error as any).all || [];
        for (const err of errors) {
          const fieldPath =
            err.path?.replace(/^\//, "").replace(/\//g, ".") || "unknown";
          validationErrors.push({
            path: fieldPath,
            message: err.message || err.summary || "Validation failed",
            value: err.value,
          });
        }
      }

      // Use custom error formatter if provided
      if (errorConfig.errorFormatter) {
        return errorConfig.errorFormatter(validationErrors);
      }

      // Default format
      const formattedErrors: Record<string, string> = {};
      for (const err of validationErrors) {
        formattedErrors[err.path] = err.message;
      }

      return createErrorMessage({
        message: RESPONSE_MESSAGE.validationError,
        result: formattedErrors,
      });
    }

    // Custom error handler
    if (errorConfig.onError) {
      const context = {
        code,
        error: error as Error,
        path: requestPath,
        method: request.method,
        request,
      };

      const customResult = errorConfig.onError(context, set);
      if (customResult !== undefined) {
        return customResult;
      }
    }

    // Debug mode - show detailed errors
    if (errorConfig.debug) {
      const err = error as any;
      return {
        status: "error",
        message: err?.message || String(error),
        code,
        stack: err?.stack,
        path: requestPath,
        method: request.method,
      };
    }

    // Default error response
    const err = error as any;
    return {
      status: "error",
      message: err?.message || String(error) || "Internal server error",
    };
  });

  // Scan routes FIRST - must register routes before Swagger
  if (existsSync(dir)) {
    await scanRoutes(dir, app, dir, [], prefix, errorConfig);
  }

  // Enable Swagger AFTER routes are registered (lazy-loaded)
  if (swaggerConfig?.enabled) {
    try {
      // Dynamic import - không bundle nếu không dùng
      const { swagger } = await import("@elysiajs/swagger");

      const swaggerOptions: any = {
        path: swaggerConfig.path || "/docs",
        exclude: swaggerConfig.exclude,
        autoDarkMode: swaggerConfig.autoDarkMode ?? true,
      };

      if (swaggerConfig.documentation) {
        swaggerOptions.documentation = {
          info: {
            title:
              swaggerConfig.documentation.info?.title || "API Documentation",
            version: swaggerConfig.documentation.info?.version || "1.0.0",
            description: swaggerConfig.documentation.info?.description,
          },
          tags: swaggerConfig.documentation.tags,
          servers: swaggerConfig.documentation.servers,
        };
      }

      app = app.use(swagger(swaggerOptions));
    } catch (error) {
      console.warn(
        "⚠️  Swagger enabled but @elysiajs/swagger not installed.",
        "\n   Install it with: bun add @elysiajs/swagger"
      );
    }
  }

  return app;
};
