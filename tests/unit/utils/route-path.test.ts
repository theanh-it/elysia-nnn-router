import { describe, it, expect } from "bun:test";
import { join } from "path";
import { toRoutePath } from "../../../src/utils/route-path";

describe("toRoutePath", () => {
  const base = "/app/routes";

  it("should convert simple route", () => {
    const filePath = join(base, "users/get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result).toBe("/users/get");
  });

  it("should convert nested route", () => {
    const filePath = join(base, "api/v1/users/get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result).toBe("/api/v1/users/get");
  });

  it("should convert dynamic route with [id]", () => {
    const filePath = join(base, "users/[id]/get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result).toBe("/users/:id/get");
  });

  it("should convert multiple dynamic params", () => {
    const filePath = join(base, "posts/[postId]/comments/[commentId]/get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result).toBe("/posts/:postId/comments/:commentId/get");
  });

  it("should handle .js extension", () => {
    const filePath = join(base, "users/get.js");
    const result = toRoutePath(filePath, base);
    
    expect(result).toBe("/users/get");
  });

  it("should handle root level route", () => {
    const filePath = join(base, "get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result).toBe("/get");
  });

  it("should handle route with special characters in folder name", () => {
    const filePath = join(base, "api-v2/users/get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result).toBe("/api-v2/users/get");
  });

  it("should convert [...slug] catch-all route", () => {
    const filePath = join(base, "docs/[...slug]/get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result).toBe("/docs/:...slug/get");
  });

  it("should handle deep nesting", () => {
    const filePath = join(base, "a/b/c/d/e/f/get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result).toBe("/a/b/c/d/e/f/get");
  });

  it("should handle mixed static and dynamic segments", () => {
    const filePath = join(base, "users/[userId]/posts/[postId]/get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result).toBe("/users/:userId/posts/:postId/get");
  });

  it("should always start with /", () => {
    const filePath = join(base, "test/get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result.startsWith("/")).toBe(true);
  });

  it("should not have trailing slash", () => {
    const filePath = join(base, "test/get.ts");
    const result = toRoutePath(filePath, base);
    
    expect(result.endsWith("/")).toBe(false);
  });

  it("should handle empty segments", () => {
    const filePath = join(base, "users//get.ts");
    const result = toRoutePath(filePath, base);
    
    // Empty segments should be filtered out
    expect(result).toBe("/users/get");
  });
});

