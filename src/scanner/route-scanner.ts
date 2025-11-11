import { Glob } from "bun";
import { join, sep } from "path";
import { Elysia, type OptionalHandler } from "elysia";
import { methods, type Method, type RouteModule, type ErrorHandlerConfig, type RouteLoadError } from "../types";
import { toRoutePath } from "../utils/route-path";
import { createBeforeHandle, createGetMiddlewares } from "../handlers/middleware";

const methodSet = new Set(methods);

/**
 * Check if a schema is a Zod schema
 */
const isZodSchema = (schema: any): boolean => {
  return schema && typeof schema === "object" && "_def" in schema && "typeName" in (schema._def || {});
};

/**
 * Lazy-load Zod converter only when needed
 */
let zodToTypeBoxCache: ((schema: any) => any) | null = null;
const getZodConverter = async () => {
  if (!zodToTypeBoxCache) {
    try {
      const { zodToTypeBox } = await import("../converters/zod-to-typebox");
      zodToTypeBoxCache = zodToTypeBox;
    } catch (error) {
      console.warn("⚠️  Zod schema detected but zod-to-typebox converter not available");
      zodToTypeBoxCache = () => undefined;
    }
  }
  return zodToTypeBoxCache;
};

/**
 * Scan routes directory and register routes with Elysia
 * Handles middleware cascading, validation, and Swagger documentation
 */
export const scanRoutes = async (
  dir: string,
  app: Elysia,
  base = dir,
  middlewares: OptionalHandler<any, any, any>[] = [],
  prefix: string,
  errorConfig: ErrorHandlerConfig = {}
) => {
  // Create new cache for each scan to avoid stale data
  const middlewareCache = new Map<string, OptionalHandler<any, any, any>[]>();
  const pathExistsCache = new Map<string, string | null>();
  const getMiddlewares = createGetMiddlewares(middlewareCache, pathExistsCache);

  // Use Bun.Glob to scan files
  const glob = new Glob("**/*.{ts,js}");
  const files = Array.from(glob.scanSync(dir));

  // Group files by directory to process middleware in order
  const filesByDir = new Map<string, string[]>();

  for (const file of files) {
    const fullPath = join(dir, file);
    const dirPath = join(fullPath, "..");

    if (!filesByDir.has(dirPath)) {
      filesByDir.set(dirPath, []);
    }
    filesByDir.get(dirPath)!.push(fullPath);
  }

  // Process each directory
  const processedDirs = new Set<string>();

  const processDirectory = async (
    dirPath: string,
    parentMiddlewares: OptionalHandler<any, any, any>[]
  ) => {
    if (processedDirs.has(dirPath)) return;
    processedDirs.add(dirPath);

    const currentMiddlewares = await getMiddlewares(dirPath, parentMiddlewares);
    const filesInDir = filesByDir.get(dirPath) || [];

    for (const fullPath of filesInDir) {
      // Skip middleware files
      if (
        fullPath.endsWith("_middleware.ts") ||
        fullPath.endsWith("_middleware.js")
      ) {
        continue;
      }

      const routePath = toRoutePath(fullPath, base);
      const parts = routePath.split("/");
      const method = parts.pop() as Method;

      const allowMethod = methodSet.has(method as Method);
      if (!allowMethod) continue;

      try {
        // Use dynamic import instead of require for ESM compatibility
        let mod: RouteModule;
        try {
          mod = await import(`file://${fullPath}`);
        } catch (importError) {
          const error: RouteLoadError = {
            path: fullPath,
            method: method.toUpperCase(),
            error: importError as Error,
            phase: "import",
          };
          
          if (errorConfig.onRouteLoadError) {
            errorConfig.onRouteLoadError(error);
          }
          
          if (errorConfig.debug) {
            console.error(`❌ Failed to import route: ${method.toUpperCase()} ${fullPath}`);
            console.error(`   Error: ${(importError as Error).message}`);
            if ((importError as Error).stack) {
              console.error(`   Stack: ${(importError as Error).stack}`);
            }
          }
          
          if (errorConfig.strict) {
            throw importError;
          }
          
          continue;
        }
        
        const routeHandler = mod.default;
        const middlewaresOfMethod = mod.middleware;
        const routeSchema = mod.schema;

        // Don't use custom validation handler - let Elysia handle validation
        // Error formatting is done via onError hook in index.ts
        const beforeHandle = createBeforeHandle(
          currentMiddlewares,
          middlewaresOfMethod
        );
        const path = [prefix, ...parts].filter(Boolean).join("/");

        // Build route options
        const routeOptions: any = {
          beforeHandle,
        };

        // Handle schema validation
        // Supports both Zod and TypeBox schemas
        if (routeSchema) {
          if (routeSchema.detail) {
            routeOptions.detail = routeSchema.detail;
          }

          // Check if we need Zod converter
          const needsZodConverter = 
            isZodSchema(routeSchema.body) ||
            isZodSchema(routeSchema.query) ||
            isZodSchema(routeSchema.params) ||
            isZodSchema(routeSchema.headers) ||
            (routeSchema.response && Object.values(routeSchema.response).some(isZodSchema));

          let zodConverter: ((schema: any) => any) | undefined;
          if (needsZodConverter) {
            zodConverter = await getZodConverter();
          }

          // Process body schema
          if (routeSchema.body) {
            const converted = isZodSchema(routeSchema.body) && zodConverter
              ? zodConverter(routeSchema.body)
              : routeSchema.body;
            if (converted) routeOptions.body = converted;
          }

          // Process query schema
          if (routeSchema.query) {
            const converted = isZodSchema(routeSchema.query) && zodConverter
              ? zodConverter(routeSchema.query)
              : routeSchema.query;
            if (converted) routeOptions.query = converted;
          }

          // Process params schema
          if (routeSchema.params) {
            const converted = isZodSchema(routeSchema.params) && zodConverter
              ? zodConverter(routeSchema.params)
              : routeSchema.params;
            if (converted) routeOptions.params = converted;
          }

          // Process headers schema
          if (routeSchema.headers) {
            const converted = isZodSchema(routeSchema.headers) && zodConverter
              ? zodConverter(routeSchema.headers)
              : routeSchema.headers;
            if (converted) routeOptions.headers = converted;
          }

          // Process response schemas
          if (routeSchema.response) {
            routeOptions.response = {};
            for (const [status, schema] of Object.entries(routeSchema.response)) {
              const converted = isZodSchema(schema) && zodConverter
                ? zodConverter(schema)
                : schema;
              if (converted) {
                routeOptions.response[status] = converted;
              }
            }
          }
        }

        // Validate handler exists
        if (!routeHandler) {
          const error: RouteLoadError = {
            path: fullPath,
            method: method.toUpperCase(),
            error: new Error("Route handler (default export) is missing"),
            phase: "validation",
          };
          
          if (errorConfig.onRouteLoadError) {
            errorConfig.onRouteLoadError(error);
          }
          
          if (errorConfig.strict) {
            throw error.error;
          }
          return;
        }
        
        // Use scoped instance to preserve middleware context
        // After .use(), reference will be garbage collected
        try {
          app.use(new Elysia()[method](path, routeHandler, routeOptions));
          
          if (errorConfig.debug) {
            console.log(`✅ Registered: ${method.toUpperCase()} /${path}`);
          }
        } catch (registrationError) {
          const error: RouteLoadError = {
            path: fullPath,
            method: method.toUpperCase(),
            error: registrationError as Error,
            phase: "registration",
          };
          
          if (errorConfig.onRouteLoadError) {
            errorConfig.onRouteLoadError(error);
          }
          
          if (errorConfig.debug) {
            console.error(`❌ Failed to register route: ${method.toUpperCase()} ${fullPath}`);
            console.error(`   Error: ${(registrationError as Error).message}`);
          }
          
          if (errorConfig.strict) {
            throw registrationError;
          }
        }
      } catch (error) {
        // General error fallback
        if (errorConfig.debug) {
          console.error(`❌ Unexpected error in route ${fullPath}:`, error);
        }
        
        if (errorConfig.strict) {
          throw error;
        }
        
        continue;
      }
    }

    // Process subdirectories
    for (const [subDir] of filesByDir) {
      if (subDir !== dirPath && subDir.startsWith(dirPath + sep)) {
        await processDirectory(subDir, currentMiddlewares);
      }
    }
  };

  // Start from root directory
  await processDirectory(dir, middlewares);
};

