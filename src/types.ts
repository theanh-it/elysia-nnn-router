import type { OptionalHandler, Context as ElysiaContext } from "elysia";
import type { ZodTypeAny, z } from "zod";

// ============================================================================
// BRANDED TYPES - For type-safe IDs and values
// ============================================================================

/**
 * Branded type utility for creating nominal types
 */
export type Brand<T, TBrand extends string> = T & { __brand: TBrand };

/**
 * User ID - branded string type
 */
export type UserId = Brand<string, "UserId">;

/**
 * Post ID - branded string type
 */
export type PostId = Brand<string, "PostId">;

/**
 * Session Token - branded string type
 */
export type SessionToken = Brand<string, "SessionToken">;

/**
 * Create a branded value
 */
export const brand = <T, TBrand extends string>(
  value: T
): Brand<T, TBrand> => value as Brand<T, TBrand>;

// ============================================================================
// HTTP METHODS
// ============================================================================

export const methods = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
] as const;

export type Method = (typeof methods)[number];

// ============================================================================
// ROUTE SCHEMA TYPES
// ============================================================================

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

// ============================================================================
// TYPE INFERENCE UTILITIES
// ============================================================================

/**
 * Infer TypeScript type from Zod schema
 */
export type InferSchema<T extends ZodTypeAny | undefined> = T extends ZodTypeAny
  ? z.infer<T>
  : unknown;

/**
 * Infer route handler types from schema
 */
export type InferRouteTypes<TSchema extends RouteSchema> = {
  body: InferSchema<TSchema["body"]>;
  query: InferSchema<TSchema["query"]>;
  params: InferSchema<TSchema["params"]>;
  headers: InferSchema<TSchema["headers"]>;
};

// ============================================================================
// ROUTE CONTEXT - Type-safe request context
// ============================================================================

/**
 * Type-safe route context with inferred types from schema
 * 
 * @example
 * ```typescript
 * const schema = {
 *   body: z.object({ name: z.string() }),
 *   query: z.object({ page: z.string() }),
 *   params: z.object({ id: z.string() })
 * };
 * 
 * export default async (ctx: RouteContext<typeof schema>) => {
 *   ctx.body.name;    // ✅ Type: string
 *   ctx.query.page;   // ✅ Type: string
 *   ctx.params.id;    // ✅ Type: string
 * };
 * ```
 */
export interface RouteContext<
  TSchema extends RouteSchema = RouteSchema,
  TBody = InferSchema<TSchema["body"]>,
  TQuery = InferSchema<TSchema["query"]>,
  TParams = InferSchema<TSchema["params"]>,
  THeaders = InferSchema<TSchema["headers"]>
> extends Omit<ElysiaContext, "body" | "query" | "params" | "headers"> {
  body: TBody;
  query: TQuery;
  params: TParams;
  headers: THeaders & Record<string, string | undefined>;
}

/**
 * Route handler function with type-safe context
 */
export type RouteHandler<TSchema extends RouteSchema = RouteSchema> = (
  context: RouteContext<TSchema>
) => Promise<any> | any;

/**
 * Type-safe middleware function
 */
export type RouteMiddleware = OptionalHandler<any, any, any>;

// ============================================================================
// ROUTE MODULE
// ============================================================================

export type RouteModule<TSchema extends RouteSchema = RouteSchema> = {
  default?: RouteHandler<TSchema> | ((context: any) => any | Promise<any>);
  schema?: TSchema;
  middleware?: RouteMiddleware | RouteMiddleware[];
  [key: string]: unknown;
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

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Validation error details
 */
export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Route loading error details
 */
export interface RouteLoadError {
  path: string;
  method: string;
  error: Error;
  phase: "import" | "validation" | "registration";
}

/**
 * Error context passed to error handlers
 */
export interface ErrorContext {
  code: string | number;
  error: Error | unknown;
  path: string;
  method: string;
  request: Request;
  validationErrors?: ValidationError[];
}

/**
 * Set object for response manipulation
 */
export interface ResponseSet {
  status?: number | string;
  headers: Record<string, string | number>;
  redirect?: string;
}

/**
 * Error formatter function type
 */
export type ErrorFormatter = (errors: ValidationError[]) => unknown;

/**
 * Error handler result type
 */
export type ErrorHandlerResult = unknown | void | Promise<unknown> | Promise<void>;

/**
 * Error handling configuration
 */
export interface ErrorHandlerConfig {
  /**
   * Custom error handler
   */
  onError?: (context: ErrorContext, set: ResponseSet) => ErrorHandlerResult;
  
  /**
   * Route load error callback
   */
  onRouteLoadError?: (error: RouteLoadError) => void;
  
  /**
   * Custom validation error formatter
   */
  errorFormatter?: ErrorFormatter;
  
  /**
   * Show detailed errors (stack traces, etc.) - default: false
   */
  debug?: boolean;
  
  /**
   * Throw on route load errors instead of continuing - default: false
   */
  strict?: boolean;
}

// ============================================================================
// SECURITY TYPES
// ============================================================================

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  enabled?: boolean;
  /** Maximum requests per window */
  max?: number;
  /** Time window (e.g., "1m", "1h") */
  window?: string;
  /** Custom error message */
  message?: string;
  /** Only count failed requests */
  skipSuccessful?: boolean;
  /** Custom key generator (e.g., by IP) */
  keyGenerator?: (request: Request) => string;
}

/**
 * CORS configuration
 */
export interface CorsConfig {
  enabled?: boolean;
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  credentials?: boolean;
  maxAge?: number;
  allowedHeaders?: string[];
  exposedHeaders?: string[];
}

/**
 * Content Security Policy directives
 */
export interface CSPDirectives {
  "default-src"?: string[];
  "script-src"?: string[];
  "style-src"?: string[];
  "img-src"?: string[];
  "font-src"?: string[];
  "connect-src"?: string[];
  "frame-src"?: string[];
  "object-src"?: string[];
  "media-src"?: string[];
  "worker-src"?: string[];
  [key: string]: string[] | undefined;
}

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  enabled?: boolean;
  contentSecurityPolicy?: boolean | {
    directives?: CSPDirectives;
  };
  xssProtection?: boolean;
  noSniff?: boolean;
  frameGuard?: boolean | "deny" | "sameorigin";
  hsts?: boolean | {
    maxAge?: number;
    includeSubDomains?: boolean;
  };
}

/**
 * Security features configuration
 */
export interface SecurityConfig {
  /** Rate limiting */
  rateLimit?: RateLimitConfig;
  /** CORS configuration */
  cors?: CorsConfig;
  /** Security headers */
  headers?: SecurityHeadersConfig;
  /** CSRF protection */
  csrf?: boolean;
  /** XSS protection via input sanitization */
  sanitizeInput?: boolean;
}

// ============================================================================
// PLUGIN OPTIONS
// ============================================================================

/**
 * Main plugin configuration options
 */
export interface NnnRouterPluginOptions {
  /** Routes directory path */
  dir?: string;
  /** API prefix (e.g., "api" → /api/users) */
  prefix?: string;
  /** Swagger documentation configuration */
  swagger?: SwaggerConfig;
  /** Error handling configuration */
  errorHandling?: ErrorHandlerConfig;
  /** Security features configuration */
  security?: SecurityConfig;
}
