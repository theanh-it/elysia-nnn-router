import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "../../src/index";
import { join } from "path";
import { mkdirSync, writeFileSync, rmSync } from "fs";

describe("Security Features", () => {
  const testDir = join(process.cwd(), "tests", "fixtures", "security-routes");

  beforeAll(() => {
    mkdirSync(join(testDir, "api"), { recursive: true });

    writeFileSync(
      join(testDir, "api", "get.ts"),
      `export default async () => ({ message: "API response" });`
    );

    writeFileSync(
      join(testDir, "api", "post.ts"),
      `export default async ({ body }) => ({ received: body });`
    );
  });

  afterAll(() => {
    rmSync(join(process.cwd(), "tests", "fixtures", "security-routes"), {
      recursive: true,
      force: true,
    });
  });

  describe("CORS", () => {
    let app: Elysia;

    beforeAll(async () => {
      await Bun.sleep(100);
      
      app = new Elysia();
      app.use(
        await nnnRouterPlugin({
          dir: "tests/fixtures/security-routes",
          security: {
            cors: {
              enabled: true,
              origin: "https://example.com",
              methods: ["GET", "POST"],
              credentials: true,
            },
          },
        })
      );
    });

    it("should set CORS headers", async () => {
      const response = await app.handle(
        new Request("http://localhost/api", {
          headers: {
            Origin: "https://example.com",
          },
        })
      );

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
      expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });

    it("should set Allow-Methods header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api", {
          headers: {
            Origin: "https://example.com",
          },
        })
      );

      const allowMethods = response.headers.get("Access-Control-Allow-Methods");
      expect(allowMethods).toBeDefined();
      expect(allowMethods).toContain("GET");
      expect(allowMethods).toContain("POST");
    });
  });

  describe("Security Headers", () => {
    let app: Elysia;

    beforeAll(async () => {
      await Bun.sleep(100);
      
      app = new Elysia();
      app.use(
        await nnnRouterPlugin({
          dir: "tests/fixtures/security-routes",
          security: {
            headers: {
              enabled: true,
              xssProtection: true,
              noSniff: true,
              frameGuard: "deny",
            },
          },
        })
      );
    });

    it("should set security headers", async () => {
      const response = await app.handle(
        new Request("http://localhost/api")
      );

      expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    });

    it("should set CSP header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api")
      );

      const csp = response.headers.get("Content-Security-Policy");
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src");
    });
  });

  describe("Rate Limiting", () => {
    let app: Elysia;

    beforeAll(async () => {
      await Bun.sleep(100);
      
      app = new Elysia();
      app.use(
        await nnnRouterPlugin({
          dir: "tests/fixtures/security-routes",
          security: {
            rateLimit: {
              enabled: true,
              max: 3,  // Only 3 requests
              window: "1m",
            },
          },
        })
      );
    });

    it("should allow requests within limit", async () => {
      const response = await app.handle(
        new Request("http://localhost/api")
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("X-RateLimit-Limit")).toBe("3");
    });

    it("should set rate limit headers", async () => {
      const response = await app.handle(
        new Request("http://localhost/api")
      );

      // Rate limit headers should be present
      const limit = response.headers.get("X-RateLimit-Limit");
      const remaining = response.headers.get("X-RateLimit-Remaining");
      
      expect(limit).toBe("3");
      expect(remaining).toBeDefined();
      
      // Should be a number
      const remainingNum = parseInt(remaining || "0");
      expect(remainingNum).toBeGreaterThanOrEqual(0);
      expect(remainingNum).toBeLessThanOrEqual(3);
    });
  });

  describe("Input Sanitization", () => {
    let app: Elysia;

    beforeAll(async () => {
      await Bun.sleep(100);
      
      app = new Elysia();
      app.use(
        await nnnRouterPlugin({
          dir: "tests/fixtures/security-routes",
          security: {
            sanitizeInput: true,
          },
        })
      );
    });

    it("should sanitize HTML tags from input", async () => {
      const response = await app.handle(
        new Request("http://localhost/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "<script>alert('xss')</script>John",
            comment: "Hello <b>world</b>",
          }),
        })
      );

      const data = await response.json();
      
      // HTML tags should be removed
      expect(data.received.name).not.toContain("<script>");
      expect(data.received.name).not.toContain("</script>");
      expect(data.received.comment).not.toContain("<b>");
    });

    it("should sanitize javascript: protocol", async () => {
      const response = await app.handle(
        new Request("http://localhost/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: "javascript:alert('xss')",
          }),
        })
      );

      const data = await response.json();
      expect(data.received.url).not.toContain("javascript:");
    });
  });
});

