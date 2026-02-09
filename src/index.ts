import { Elysia, type OptionalHandler } from "elysia";
import { Glob } from "bun";
import { join, relative, sep } from "path";
import { existsSync } from "fs";

const methods = ["get", "post", "put", "delete", "patch", "options"] as const;
const methodSet = new Set(methods);

type Method = (typeof methods)[number];

type RouteModule = {
  default?: any;
  [key: string]: any;
};

const toRoutePath = (filePath: string, base: string) => {
  const rel = relative(base, filePath).replace(/\.(ts|js)$/, "");

  return (
    "/" +
    rel
      .split(sep)
      .map((part) => {
        if (part.startsWith("[") && part.endsWith("]"))
          return `:${part.slice(1, -1)}`;
        return part;
      })
      .filter(Boolean)
      .join("/")
  );
};

const createGetMiddlewares = (
  middlewareCache: Map<string, OptionalHandler<any, any, any>[]>,
  pathExistsCache: Map<string, string | null>
) => {
  return (dir: string, middlewares: OptionalHandler<any, any, any>[] = []) => {
    // Check cache trước
    if (middlewareCache.has(dir)) {
      const cached = middlewareCache.get(dir)!;
      // Nếu không có middleware trong dir này, return luôn parent middlewares
      if (cached.length === 0) return middlewares;
      // Nếu có, concat với parent
      return middlewares.length === 0 ? cached : middlewares.concat(cached);
    }

    // Tìm middleware file - check cả .ts và .js (với cache)
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
      const mwModule = require(middlewarePath);
      const mw = mwModule.default;

      if (mw) {
        // Normalize thành array ngay lập tức
        dirMiddlewares = Array.isArray(mw) ? mw : [mw];
      }
    }

    // Cache middleware của dir này
    middlewareCache.set(dir, dirMiddlewares);

    // Return kết quả
    if (dirMiddlewares.length === 0) return middlewares;
    return middlewares.length === 0
      ? dirMiddlewares
      : middlewares.concat(dirMiddlewares);
  };
};

const createBeforeHandle = (
  commonMiddlewares: OptionalHandler<any, any, any>[],
  middlewaresOfMethod?:
    | OptionalHandler<any, any, any>[]
    | OptionalHandler<any, any, any>
) => {
  // Nếu không có method middleware, reuse common middlewares
  if (!middlewaresOfMethod) {
    return commonMiddlewares;
  }

  // Nếu không có common middlewares, return method middlewares
  if (commonMiddlewares.length === 0) {
    return Array.isArray(middlewaresOfMethod)
      ? middlewaresOfMethod
      : [middlewaresOfMethod];
  }

  // Cần merge cả hai - tạo array mới
  if (Array.isArray(middlewaresOfMethod)) {
    return commonMiddlewares.concat(middlewaresOfMethod);
  }

  return commonMiddlewares.concat([middlewaresOfMethod]);
};

const scanRoutes = (
  dir: string,
  app: Elysia,
  base = dir,
  middlewares: OptionalHandler<any, any, any>[] = [],
  prefix: string
) => {
  // Tạo cache mới cho mỗi lần scan để tránh stale data
  const middlewareCache = new Map<string, OptionalHandler<any, any, any>[]>();
  const pathExistsCache = new Map<string, string | null>();
  const getMiddlewares = createGetMiddlewares(middlewareCache, pathExistsCache);

  // Sử dụng Bun.Glob để scan files
  const glob = new Glob("**/*.{ts,js}");
  const files = Array.from(glob.scanSync(dir));

  // Group files by directory để xử lý middleware theo thứ tự
  const filesByDir = new Map<string, string[]>();

  for (const file of files) {
    const fullPath = join(dir, file);
    const dirPath = join(fullPath, "..");

    if (!filesByDir.has(dirPath)) {
      filesByDir.set(dirPath, []);
    }
    filesByDir.get(dirPath)!.push(fullPath);
  }

  // Xử lý từng directory
  const processedDirs = new Set<string>();

  const processDirectory = (
    dirPath: string,
    parentMiddlewares: OptionalHandler<any, any, any>[]
  ) => {
    if (processedDirs.has(dirPath)) return;
    processedDirs.add(dirPath);

    const currentMiddlewares = getMiddlewares(dirPath, parentMiddlewares);
    const filesInDir = filesByDir.get(dirPath) || [];
    const findDynamicRoute = filesInDir.reduce(
      (acc: any, fullPath: any) => {
        if (fullPath.endsWith("[") || fullPath.endsWith("]")) {
          acc.dynamic.push(fullPath);
        } else {
          acc.static.push(fullPath);
        }

        return acc;
      },
      { static: [], dynamic: [] }
    );
    const sortedInDir = findDynamicRoute.static.concat(
      findDynamicRoute.dynamic
    );

    for (const fullPath of sortedInDir) {
      // Skip middleware files
      if (
        fullPath.endsWith("_middleware.ts") ||
        fullPath.endsWith("_middleware.js")
      ) {
        continue;
      }

      const routePath = toRoutePath(fullPath, base);
      const parts = routePath.split("/").filter(Boolean); // Remove empty strings
      const method = parts.pop() as Method;

      const allowMethod = methodSet.has(method as Method);
      if (!allowMethod) continue;

      const mod: RouteModule = require(fullPath);
      const routeHandler = mod.default;
      const middlewaresOfMethod = mod.middleware;
      const beforeHandle = createBeforeHandle(
        currentMiddlewares,
        middlewaresOfMethod
      );

      // Xây dựng path: nếu không có parts (chỉ có method), thì path là "/"
      const pathParts = parts.length === 0 ? [] : parts;
      const filteredParts = [prefix, ...pathParts].filter(Boolean);
      const path = filteredParts.length === 0 ? "/" : filteredParts.join("/");

      // Sử dụng scoped instance để preserve middleware context
      // Sau khi .use(), reference sẽ được garbage collected
      app.use(
        new Elysia()[method](path, routeHandler, {
          beforeHandle,
        })
      );
    }

    // Xử lý subdirectories
    for (const [subDir] of filesByDir) {
      if (subDir !== dirPath && subDir.startsWith(dirPath + sep)) {
        processDirectory(subDir, currentMiddlewares);
      }
    }
  };

  // Bắt đầu từ root directory
  processDirectory(dir, middlewares);
};

const defaultPath = join(process.cwd(), "routes");

export type NnnRouterPluginOptions = {
  dir?: string;
  prefix?: string;
};

export const nnnRouterPlugin = (options: NnnRouterPluginOptions = {}) => {
  const dir = options.dir ? join(process.cwd(), options.dir) : defaultPath;
  const prefix = options.prefix || "";

  const app = new Elysia();

  // Scan routes ngay lập tức nếu thư mục tồn tại
  if (existsSync(dir)) {
    // scanRoutes sẽ tự tạo và xử lý middleware cache
    scanRoutes(dir, app, dir, [], prefix);
  }

  return app;
};
