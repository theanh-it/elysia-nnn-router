import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "../../src/index";
import { join } from "path";
import { mkdirSync, writeFileSync, rmSync } from "fs";

describe("Error Handling Configuration", () => {
  const testDir = join(process.cwd(), "tests", "fixtures", "error-routes");

  afterAll(() => {
    rmSync(join(process.cwd(), "tests", "fixtures", "error-routes"), {
      recursive: true,
      force: true,
    });
  });

  describe("Custom Error Formatter", () => {
    let app: Elysia;

    beforeAll(async () => {
      mkdirSync(join(testDir, "users"), { recursive: true });

      writeFileSync(
        join(testDir, "users", "post.ts"),
        `
        import { z } from "zod";
        export const schema = {
          body: z.object({
            email: z.string().email(),
            age: z.number().min(18),
          }),
        };
        export default async ({ body }) => ({ success: true });
        `
      );

      await Bun.sleep(100);

      app = new Elysia();
      app.use(
        await nnnRouterPlugin({
          dir: "tests/fixtures/error-routes",
          errorHandling: {
            errorFormatter: (errors) => ({
              // Custom format
              success: false,
              errors: errors.map(e => ({
                field: e.path,
                error: e.message,
              })),
            }),
          },
        })
      );
    });

    it("should use custom error formatter", async () => {
      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "invalid-email",
            age: 15,
          }),
        })
      );

      expect(response.status).toBe(422);
      const data = await response.json();
      
      // Custom format
      expect(data.success).toBe(false);
      expect(Array.isArray(data.errors)).toBe(true);
      expect(data.errors.length).toBeGreaterThan(0);
      expect(data.errors[0].field).toBeDefined();
      expect(data.errors[0].error).toBeDefined();
    });
  });

  describe("Custom Error Handler", () => {
    let app: Elysia;
    let errorContext: any = null;

    beforeAll(async () => {
      mkdirSync(join(testDir, "error-test"), { recursive: true });

      writeFileSync(
        join(testDir, "error-test", "get.ts"),
        `export default async () => {
          throw new Error("Custom error");
        };`
      );

      await Bun.sleep(100);

      app = new Elysia();
      app.use(
        await nnnRouterPlugin({
          dir: "tests/fixtures/error-routes",
          errorHandling: {
            onError: (context, set) => {
              errorContext = context;
              set.status = 500;
              return {
                custom: true,
                error: context.error.message,
                path: context.path,
              };
            },
          },
        })
      );
    });

    it("should use custom error handler", async () => {
      const response = await app.handle(
        new Request("http://localhost/error-test")
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      
      // Custom response
      expect(data.custom).toBe(true);
      expect(data.error).toBe("Custom error");
      expect(data.path).toBe("/error-test");
      
      // Context captured
      expect(errorContext).toBeDefined();
      expect(errorContext.path).toBe("/error-test");
      expect(errorContext.method).toBe("GET");
    });
  });

  describe("Debug Mode", () => {
    let app: Elysia;

    beforeAll(async () => {
      mkdirSync(join(testDir, "debug"), { recursive: true });

      writeFileSync(
        join(testDir, "debug", "get.ts"),
        `export default async () => {
          const error = new Error("Debug test error");
          error.stack = "Stack trace here";
          throw error;
        };`
      );

      await Bun.sleep(100);

      app = new Elysia();
      app.use(
        await nnnRouterPlugin({
          dir: "tests/fixtures/error-routes",
          errorHandling: {
            debug: true,  // Enable debug mode
          },
        })
      );
    });

    it("should show stack traces in debug mode", async () => {
      const response = await app.handle(
        new Request("http://localhost/debug")
      );

      const data = await response.json();
      
      // Debug info included
      expect(data.status).toBe("error");
      expect(data.message).toBe("Debug test error");
      expect(data.stack).toBeDefined();
      expect(data.path).toBe("/debug");
      expect(data.method).toBe("GET");
      expect(data.code).toBeDefined();
    });
  });

  describe("Route Load Error Callback", () => {
    let loadErrors: any[] = [];

    beforeAll(async () => {
      mkdirSync(join(testDir, "broken"), { recursive: true });

      // Broken route file
      writeFileSync(
        join(testDir, "broken", "get.ts"),
        `this is invalid typescript code that will fail to import`
      );

      await Bun.sleep(100);

      const app = new Elysia();
      await nnnRouterPlugin({
        dir: "tests/fixtures/error-routes",
        errorHandling: {
          onRouteLoadError: (error) => {
            loadErrors.push(error);
          },
          debug: false,  // No console spam
          strict: false, // Continue on error
        },
      });
    });

    it("should call onRouteLoadError callback", () => {
      // At least one error should be captured
      expect(loadErrors.length).toBeGreaterThan(0);
      
      const error = loadErrors[0];
      expect(error.path).toContain("broken");
      expect(error.method).toBe("GET");
      expect(error.phase).toBe("import");
      expect(error.error).toBeInstanceOf(Error);
    });
  });
});

