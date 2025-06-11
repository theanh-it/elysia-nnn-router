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

function toRoutePath(filePath: string, base: string) {
  const relative = path.relative(base, filePath).replace(/\.(ts|js)$/, "");
  return (
    "/" +
    relative
      .split(path.sep)
      .map((part) => {
        if (part === "index") return "";
        if (part.startsWith("[") && part.endsWith("]"))
          return `:${part.slice(1, -1)}`;
        return part;
      })
      .filter(Boolean)
      .join("/")
  );
}

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
  middlewares: Elysia[] = []
) => {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);

    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      const newMiddlewares = getMiddlewares(fullPath, middlewares);

      scanRoutes(fullPath, app, base, newMiddlewares);
    } else {
      const routePath = toRoutePath(fullPath, base);

      const parts = routePath.split("/");
      const method = parts.pop() as Method;

      const mod: RouteModule = require(fullPath);
      const routeHandler = mod.default;

      const allowMethod = methodSet.has(method as Method);

      if (!allowMethod) continue;

      const scoped = new Elysia()[method](parts.join("/"), routeHandler, {
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

export const nnnRouterPlugin = (dir: string = defaultPath) => {
  const app = new Elysia().onStart((app: Elysia) => {
    const middlewares = getMiddlewares(dir);
    scanRoutes(dir, app, dir, middlewares);
  });

  return app;
};
