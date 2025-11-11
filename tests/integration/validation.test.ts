import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "../../src/index";
import { join } from "path";
import { mkdirSync, writeFileSync, rmSync } from "fs";

describe("Validation Integration", () => {
  const testDir = join(process.cwd(), "tests", "fixtures", "validation-routes");
  let app: Elysia;

  beforeAll(async () => {
    mkdirSync(join(testDir, "users"), { recursive: true });

    // Route with Zod validation
    writeFileSync(
      join(testDir, "users", "post.ts"),
      `
      import { z } from "zod";
      
      export const schema = {
        body: z.object({
          name: z.string().min(3).max(50),
          email: z.string().email(),
          age: z.number().int().min(18).optional(),
        }),
      };
      
      export default async ({ body }: any) => {
        return { success: true, data: body };
      };
      `
    );

    // Route with TypeBox validation
    writeFileSync(
      join(testDir, "users", "put.ts"),
      `
      import { Type } from "@sinclair/typebox";
      
      export const schema = {
        body: Type.Object({
          name: Type.String({ minLength: 3, maxLength: 50 }),
          email: Type.String({ format: "email" }),
        }),
      };
      
      export default async ({ body }: any) => {
        return { success: true, updated: body };
      };
      `
    );

    app = new Elysia();
    app.use(
      await nnnRouterPlugin({
        dir: "tests/fixtures/validation-routes",
      })
    );
  });

  afterAll(() => {
    rmSync(join(process.cwd(), "tests", "fixtures", "validation-routes"), {
      recursive: true,
      force: true,
    });
  });

  describe("Zod Validation", () => {
    it("should accept valid data", async () => {
      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            age: 25,
          }),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("John Doe");
    });

    it("should reject name too short", async () => {
      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jo",
            email: "john@example.com",
          }),
        })
      );

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.status).toBe("error");
      expect(data.message).toContain("Validation error");
    });

    it("should reject invalid email", async () => {
      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "invalid-email",
          }),
        })
      );

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.status).toBe("error");
      expect(data.result.email).toContain("email");
    });

    it("should reject age < 18", async () => {
      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            age: 15,
          }),
        })
      );

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.status).toBe("error");
    });

    it("should accept optional age field", async () => {
      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
          }),
        })
      );

      expect(response.status).toBe(200);
    });
  });

  describe("TypeBox Validation", () => {
    it("should accept valid data", async () => {
      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Doe",
            email: "jane@example.com",
          }),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updated.name).toBe("Jane Doe");
    });

    it("should reject name too short", async () => {
      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jo",
            email: "jane@example.com",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should reject invalid email format", async () => {
      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Doe",
            email: "not-an-email",
          }),
        })
      );

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.result.email).toContain("email");
    });
  });

  describe("Mixed Validation Errors", () => {
    it("should return multiple validation errors", async () => {
      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jo",
            email: "invalid",
            age: 15,
          }),
        })
      );

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.status).toBe("error");
      expect(Object.keys(data.result).length).toBeGreaterThan(1);
    });
  });
});

