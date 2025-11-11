import type { OptionalHandler } from "elysia";
import type { ZodTypeAny } from "zod";

export const methods = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
] as const;

export type Method = (typeof methods)[number];

export type RouteSchema = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
  headers?: ZodTypeAny;
  response?: Record<number, ZodTypeAny>;
  detail?: {
    summary?: string;
    description?: string;
    tags?: string[];
    deprecated?: boolean;
    operationId?: string;
  };
};

export type RouteModule = {
  default?: any;
  schema?: RouteSchema;
  middleware?:
    | OptionalHandler<any, any, any>[]
    | OptionalHandler<any, any, any>;
  [key: string]: any;
};

export type SwaggerConfig = {
  enabled?: boolean;
  path?: string;
  documentation?: {
    info?: {
      title?: string;
      version?: string;
      description?: string;
    };
    tags?: Array<{
      name: string;
      description?: string;
    }>;
    servers?: Array<{
      url: string;
      description?: string;
    }>;
  };
  autoDarkMode?: boolean;
  exclude?: string[];
};

export type ValidationError = {
  path: string;
  message: string;
  value?: any;
};

export type RouteLoadError = {
  path: string;
  method: string;
  error: Error;
  phase: "import" | "validation" | "registration";
};

export type ErrorContext = {
  code: string | number;
  error: any;
  path: string;
  method: string;
  request: Request;
  validationErrors?: ValidationError[];
};

export type ErrorFormatter = (errors: ValidationError[]) => any;

export type ErrorHandlerConfig = {
  // Custom error handler
  onError?: (context: ErrorContext, set: any) => any;
  
  // Route load error callback
  onRouteLoadError?: (error: RouteLoadError) => void;
  
  // Custom validation error formatter
  errorFormatter?: ErrorFormatter;
  
  // Show detailed errors (stack traces, etc.) - default: false
  debug?: boolean;
  
  // Throw on route load errors instead of continuing - default: false
  strict?: boolean;
};

export type RateLimitConfig = {
  enabled?: boolean;
  max?: number;           // Max requests per window
  window?: string;        // Time window (e.g., "1m", "1h")
  message?: string;       // Custom error message
  skipSuccessful?: boolean;  // Only count failed requests
  keyGenerator?: (request: Request) => string;  // Custom key (e.g., by IP)
};

export type CorsConfig = {
  enabled?: boolean;
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  credentials?: boolean;
  maxAge?: number;
  allowedHeaders?: string[];
  exposedHeaders?: string[];
};

export type SecurityHeadersConfig = {
  enabled?: boolean;
  contentSecurityPolicy?: boolean | {
    directives?: Record<string, string[]>;
  };
  xssProtection?: boolean;
  noSniff?: boolean;
  frameGuard?: boolean | "deny" | "sameorigin";
  hsts?: boolean | {
    maxAge?: number;
    includeSubDomains?: boolean;
  };
};

export type SecurityConfig = {
  rateLimit?: RateLimitConfig;
  cors?: CorsConfig;
  headers?: SecurityHeadersConfig;
  csrf?: boolean;  // CSRF protection
  sanitizeInput?: boolean;  // XSS protection
};

export type NnnRouterPluginOptions = {
  dir?: string;
  prefix?: string;
  swagger?: SwaggerConfig;
  errorHandling?: ErrorHandlerConfig;
  security?: SecurityConfig;
};
