import { Elysia, type OptionalHandler, type Context } from "elysia";
import { Glob } from "bun";
import { join, relative, sep } from "path";
import { existsSync } from "fs";

const methods = ["get", "post", "put", "delete", "patch", "options"] as const;
const methodSet = new Set(methods);

type Method = (typeof methods)[number];

type RouteHandler = (context: Context) => unknown | Promise<unknown>;
type Middleware = OptionalHandler<any, any, any>;

type RouteModule = {
  default?: RouteHandler;
  middleware?: Middleware | Middleware[];
  [key: string]: unknown;
};

type ScanOptions = {
  onError?: (error: Error, filePath: string) => void;
  logger?: (...args: any[]) => void;
  verbose?: boolean;
};

type RouteEntry = { method: string; path: string; file: string };

const formatRoutesTable = (routes: RouteEntry[]): string => {
  if (routes.length === 0) return "";
  const colMethod = "Method";
  const colPath = "Path";
  const colFile = "File";
  const wMethod = Math.max(
    colMethod.length,
    ...routes.map((r) => r.method.length)
  );
  const wPath = Math.max(colPath.length, ...routes.map((r) => r.path.length));
  const header = `${colMethod.padEnd(wMethod)}  ${colPath.padEnd(
    wPath
  )}  ${colFile}`;
  const separator = "-".repeat(header.length);
  const rows = routes.map(
    (r) => `${r.method.padEnd(wMethod)}  ${r.path.padEnd(wPath)}  ${r.file}`
  );
  return [
    "[elysia-nnn-router] Registered routes:",
    separator,
    header,
    separator,
    ...rows,
    separator,
  ].join("\n");
};

const normalizePath = (path: string): string => {
  const cleaned = path.replace(/\/+/g, "/").replace(/\/$/, "");
  return cleaned === "/" ? "/" : cleaned || "";
};

const toRoutePath = (filePath: string, base: string) => {
  const rel = relative(base, filePath).replace(/\.(ts|js)$/, "");

  const rawPath =
    "/" +
    rel
      .split(sep)
      .map((part) => {
        if (part.startsWith("[") && part.endsWith("]"))
          return `:${part.slice(1, -1)}`;
        return part;
      })
      .filter(Boolean)
      .join("/");

  const normalized = normalizePath(rawPath);
  return normalized === "" ? "/" : normalized;
};

const createGetMiddlewares = (
  middlewareCache: Map<string, Middleware[]>,
  pathExistsCache: Map<string, string | null>,
  options?: ScanOptions
) => {
  return (dir: string, middlewares: Middleware[] = []) => {
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
      try {
        const mwModule = require(middlewarePath);
        const mw = mwModule.default;

        if (mw) {
          // Normalize thành array ngay lập tức
          dirMiddlewares = Array.isArray(mw) ? mw : [mw];
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (options?.onError) {
          options.onError(err, middlewarePath);
        } else {
          console.error(
            `[elysia-nnn-router] Failed to load middleware: ${middlewarePath}`,
            err.message
          );
        }
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
  commonMiddlewares: Middleware[],
  middlewaresOfMethod?: Middleware[] | Middleware
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
  middlewares: Middleware[] = [],
  prefix: string,
  options?: ScanOptions
) => {
  // Tạo cache mới cho mỗi lần scan để tránh stale data
  const middlewareCache = new Map<string, Middleware[]>();
  const pathExistsCache = new Map<string, string | null>();
  const getMiddlewares = createGetMiddlewares(
    middlewareCache,
    pathExistsCache,
    options
  );

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

  const processedDirs = new Set<string>();
  const registeredRoutes: RouteEntry[] = [];

  const processDirectory = (
    dirPath: string,
    parentMiddlewares: Middleware[]
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

      let mod: RouteModule;
      try {
        mod = require(fullPath);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (options?.onError) {
          options.onError(err, fullPath);
        } else {
          console.error(
            `[elysia-nnn-router] Failed to load route: ${fullPath}`,
            err.message
          );
        }
        continue;
      }

      const routeHandler = mod.default;
      if (typeof routeHandler !== "function") {
        const err = new Error(
          `[elysia-nnn-router] Route handler must export a default function: ${fullPath}`
        );

        if (options?.onError) {
          options.onError(err, fullPath);
        } else {
          console.warn(err.message);
        }
        continue;
      }

      const middlewaresOfMethod = mod.middleware;
      const beforeHandle = createBeforeHandle(
        currentMiddlewares,
        middlewaresOfMethod
      );

      // Xây dựng path: nếu không có parts (chỉ có method), thì path là "/"
      const pathParts = parts.length === 0 ? [] : parts;
      const filteredParts = [prefix, ...pathParts].filter(Boolean);
      const pathRaw =
        filteredParts.length === 0 ? "/" : filteredParts.join("/");
      const path = normalizePath(pathRaw) || "/";

      // Sử dụng scoped instance để preserve middleware context
      // Sau khi .use(), reference sẽ được garbage collected
      app.use(
        new Elysia()[method](path, routeHandler, {
          beforeHandle,
        })
      );

      if (options?.verbose) {
        registeredRoutes.push({
          method: method.toUpperCase(),
          path,
          file: relative(base, fullPath),
        });
      }
    }

    // Xử lý subdirectories
    for (const [subDir] of filesByDir) {
      if (subDir !== dirPath && subDir.startsWith(dirPath + sep)) {
        processDirectory(subDir, currentMiddlewares);
      }
    }
  };

  processDirectory(dir, middlewares);

  if (options?.verbose && options.logger && registeredRoutes.length > 0) {
    options.logger(formatRoutesTable(registeredRoutes));
  }
};

const defaultPath = join(process.cwd(), "routes");

export type NnnRouterPluginOptions = {
  dir?: string;
  prefix?: string;
  silent?: boolean;
  verbose?: boolean;
  onError?: (error: Error, filePath: string) => void;
};

export const nnnRouterPlugin = (options: NnnRouterPluginOptions = {}) => {
  const dir = options.dir ? join(process.cwd(), options.dir) : defaultPath;
  const rawPrefix = options.prefix ?? "";
  const normalizedPrefix = normalizePath(rawPrefix).replace(/^\//, "");

  const app = new Elysia();

  // Scan routes ngay lập tức nếu thư mục tồn tại
  if (existsSync(dir)) {
    // scanRoutes sẽ tự tạo và xử lý middleware cache
    const logger =
      options.silent === true
        ? undefined
        : (...args: any[]) => console.log(...args);

    const scanOptions: ScanOptions = {
      onError: options.onError,
      logger,
      verbose: options.verbose === true,
    };

    scanRoutes(dir, app, dir, [], normalizedPrefix, scanOptions);
  }

  return app;
};
