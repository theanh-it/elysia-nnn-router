import { existsSync } from "fs";
import { join } from "path";
import type { OptionalHandler } from "elysia";

/**
 * Create middleware management functions
 * Handles caching and cascading of directory-level middlewares
 */
export const createGetMiddlewares = (
  middlewareCache: Map<string, OptionalHandler<any, any, any>[]>,
  pathExistsCache: Map<string, string | null>
) => {
  return async (
    dir: string,
    middlewares: OptionalHandler<any, any, any>[] = []
  ): Promise<OptionalHandler<any, any, any>[]> => {
    // Check cache first
    if (middlewareCache.has(dir)) {
      const cached = middlewareCache.get(dir)!;
      // If no middleware in this dir, return parent middlewares
      if (cached.length === 0) return middlewares;
      // If exists, concat with parent
      return middlewares.length === 0 ? cached : middlewares.concat(cached);
    }

    // Find middleware file - check both .ts and .js (with cache)
    let middlewarePath: string | null = null;
    const cacheKey = dir;

    if (pathExistsCache.has(cacheKey)) {
      middlewarePath = pathExistsCache.get(cacheKey)!;
    } else {
      const middlewarePathTs = join(dir, "_middleware.ts");
      const middlewarePathJs = join(dir, "_middleware.js");

      middlewarePath = existsSync(middlewarePathTs)
        ? middlewarePathTs
        : existsSync(middlewarePathJs)
        ? middlewarePathJs
        : null;

      pathExistsCache.set(cacheKey, middlewarePath);
    }

    let dirMiddlewares: OptionalHandler<any, any, any>[] = [];

    if (middlewarePath) {
      // Use dynamic import for ESM compatibility
      const mwModule = await import(`file://${middlewarePath}`);
      const mw = mwModule.default;

      if (mw) {
        // Normalize to array immediately
        dirMiddlewares = Array.isArray(mw) ? mw : [mw];
      }
    }

    // Cache middleware of this dir
    middlewareCache.set(dir, dirMiddlewares);

    // Return result
    if (dirMiddlewares.length === 0) return middlewares;
    return middlewares.length === 0
      ? dirMiddlewares
      : middlewares.concat(dirMiddlewares);
  };
};

/**
 * Create beforeHandle array from common and method-specific middlewares
 */
export const createBeforeHandle = (
  commonMiddlewares: OptionalHandler<any, any, any>[],
  middlewaresOfMethod?:
    | OptionalHandler<any, any, any>[]
    | OptionalHandler<any, any, any>
): OptionalHandler<any, any, any>[] => {
  // If no method middleware, reuse common middlewares
  if (!middlewaresOfMethod) {
    return commonMiddlewares;
  }

  // If no common middlewares, return method middlewares
  if (commonMiddlewares.length === 0) {
    return Array.isArray(middlewaresOfMethod)
      ? middlewaresOfMethod
      : [middlewaresOfMethod];
  }

  // Need to merge both - create new array
  if (Array.isArray(middlewaresOfMethod)) {
    return commonMiddlewares.concat(middlewaresOfMethod);
  }

  return commonMiddlewares.concat([middlewaresOfMethod]);
};
