import { Elysia, OptionalHandler } from "elysia";
import path from "path";
import { existsSync, readdirSync, statSync } from "fs";

const methods = ["get", "post", "put", "delete", "patch", "options"] as const;
const methodSet = new Set(methods);

type Method = (typeof methods)[number];

type RouteModule = {
  default?: any;
  [key: string]: any;
};

const toRoutePath = (filePath: string, base: string) => {
  const relative = path.relative(base, filePath).replace(/\.(ts|js)$/, "");

  return (
    "/" +
    relative
      .split(path.sep)
      .map((part) => {
        if (part.startsWith("[") && part.endsWith("]"))
          return `:${part.slice(1, -1)}`;
        return part;
      })
      .filter(Boolean)
      .join("/")
  );
};

const getMiddlewares = (dir: string, middlewares: Elysia[] = []) => {
  const middlewarePath = path.join(dir, "_middleware.ts");
  let newMiddlewares: Elysia[] = middlewares.concat([]);

  const isMiddleware = existsSync(middlewarePath);

  if (isMiddleware) {
    const mwModule = require(middlewarePath);
    const mw = mwModule.default as Elysia;

    if (mw) {
      newMiddlewares = middlewares.concat(mw);
    }
  }

  return newMiddlewares;
};

const scanRoutes = (
  dir: string,
  app: Elysia,
  base = dir,
  middlewares: Elysia[] = [],
  prefix: string
) => {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);

    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      const newMiddlewares = getMiddlewares(fullPath, middlewares);

      scanRoutes(fullPath, app, base, newMiddlewares, prefix);
    } else {
      const routePath = toRoutePath(fullPath, base);

      const parts = routePath.split("/");
      const method = parts.pop() as Method;

      const mod: RouteModule = require(fullPath);
      const routeHandler = mod.default;

      const allowMethod = methodSet.has(method as Method);

      if (!allowMethod) continue;

      const path = [prefix, ...parts].filter(Boolean).join("/");

      const scoped = new Elysia()[method](path, routeHandler, {
        beforeHandle: middlewares as unknown as OptionalHandler<
          any,
          any,
          any
        >[],
      });

      app.use(scoped);
    }
  }
};

const defaultPath = path.join(process.cwd(), "routes");

export type NnnRouterPluginOptions = {
  dir?: string;
  prefix?: string;
};

export const nnnRouterPlugin = (options: NnnRouterPluginOptions = {}) => {
  const dir = options.dir ? path.join(process.cwd(), options.dir) : defaultPath;
  const prefix = options.prefix || "";

  const app = new Elysia().onStart((app: Elysia) => {
    const middlewares = getMiddlewares(dir);
    scanRoutes(dir, app, dir, middlewares, prefix);
  });

  return app;
};
