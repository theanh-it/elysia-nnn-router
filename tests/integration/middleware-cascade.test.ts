import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "../../src/index";
import { join } from "path";
import { mkdirSync, writeFileSync, rmSync } from "fs";

describe("Middleware Cascading Integration", () => {
  const testDir = join(process.cwd(), "tests", "fixtures", "middleware-routes");
  let app: Elysia;

  beforeAll(async () => {
    // Create simple directory structure
    mkdirSync(join(testDir, "api"), { recursive: true });

    // Simple route without middlewares first
    writeFileSync(
      join(testDir, "api", "get.ts"),
      `export default async () => {
        return { success: true, middlewares: ["handler"] };
      };`
    );

    // Wait for files
    await Bun.sleep(100);

    // Initialize app
    app = new Elysia();
    app.use(
      await nnnRouterPlugin({
        dir: "tests/fixtures/middleware-routes",
      })
    );
  });

  afterAll(() => {
    rmSync(join(process.cwd(), "tests", "fixtures", "middleware-routes"), {
      recursive: true,
      force: true,
    });
  });

  it("should register and execute route", async () => {
    const response = await app.handle(new Request("http://localhost/api"));

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.middlewares).toBeDefined();
  });
});

describe("Middleware with Route", () => {
  const testDir = join(process.cwd(), "tests", "fixtures", "multi-middleware");
  let app: Elysia;

  beforeAll(async () => {
    mkdirSync(join(testDir), { recursive: true });

    // Simple route
    writeFileSync(
      join(testDir, "get.ts"),
      `export default async () => {
        return { success: true, message: "Route works" };
      };`
    );

    await Bun.sleep(100);

    app = new Elysia();
    app.use(
      await nnnRouterPlugin({
        dir: "tests/fixtures/multi-middleware",
      })
    );
  });

  afterAll(() => {
    rmSync(join(process.cwd(), "tests", "fixtures", "multi-middleware"), {
      recursive: true,
      force: true,
    });
  });

  it("should handle basic route", async () => {
    const response = await app.handle(new Request("http://localhost/"));

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Route works");
  });
});
