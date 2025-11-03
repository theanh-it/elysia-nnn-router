import { Elysia, OptionalHandler } from "elysia";
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

const getMiddlewares = (
  dir: string,
  middlewares: OptionalHandler<any, any, any>[] = []
) => {
  let newMiddlewares: OptionalHandler<any, any, any>[] = middlewares.concat([]);

  // Tìm middleware file - check cả .ts và .js
  const middlewarePathTs = join(dir, "_middleware.ts");
  const middlewarePathJs = join(dir, "_middleware.js");

  const middlewarePath = existsSync(middlewarePathTs)
    ? middlewarePathTs
    : existsSync(middlewarePathJs)
    ? middlewarePathJs
    : null;

  if (middlewarePath) {
    const mwModule = require(middlewarePath);
    const mw = mwModule.default;

    if (mw) {
      // Middleware có thể là array of handlers hoặc single handler
      if (Array.isArray(mw)) {
        newMiddlewares = middlewares.concat(mw);
      } else {
        newMiddlewares = middlewares.concat([mw]);
      }
    }
  }

  return newMiddlewares;
};

const scanRoutes = (
  dir: string,
  app: Elysia,
  base = dir,
  middlewares: OptionalHandler<any, any, any>[] = [],
  prefix: string
) => {
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

      const mod: RouteModule = require(fullPath);
      const routeHandler = mod.default;

      const path = [prefix, ...parts].filter(Boolean).join("/");

      // Tạo scoped instance và đăng ký route với middlewares
      const scoped = new Elysia()[method](path, routeHandler, {
        beforeHandle: currentMiddlewares,
      });

      app.use(scoped);
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
    const middlewares = getMiddlewares(dir);
    scanRoutes(dir, app, dir, middlewares, prefix);
  }

  return app;
};
