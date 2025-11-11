import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "../../src/index";
import { join } from "path";
import { mkdirSync, writeFileSync, rmSync } from "fs";

describe("Routing Integration", () => {
  const testDir = join(process.cwd(), "tests", "fixtures", "routes");
  let app: Elysia;

  beforeAll(async () => {
    // Create test routes directory
    mkdirSync(join(testDir, "users"), { recursive: true });
    mkdirSync(join(testDir, "posts"), { recursive: true });
    mkdirSync(join(testDir, "users", "[id]"), { recursive: true });

    // Create route files
    writeFileSync(
      join(testDir, "users", "get.ts"),
      `export default async () => ({ users: [] });`
    );

    writeFileSync(
      join(testDir, "users", "post.ts"),
      `export default async ({ body }: any) => ({ created: true, data: body });`
    );

    writeFileSync(
      join(testDir, "users", "[id]", "get.ts"),
      `export default async ({ params }: any) => ({ userId: params.id });`
    );

    writeFileSync(
      join(testDir, "posts", "get.ts"),
      `export default async () => ({ posts: [] });`
    );

    // Initialize app with router
    app = new Elysia();
    app.use(
      await nnnRouterPlugin({
        dir: "tests/fixtures/routes",
        prefix: "api",
      })
    );
  });

  afterAll(() => {
    // Clean up test directory
    rmSync(join(process.cwd(), "tests", "fixtures"), { recursive: true, force: true });
  });

  it("should register GET /api/users route", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ users: [] });
  });

  it("should register POST /api/users route", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "John" }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ created: true, data: { name: "John" } });
  });

  it("should register dynamic route GET /api/users/:id", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/123")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ userId: "123" });
  });

  it("should register GET /api/posts route", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/posts")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ posts: [] });
  });

  it("should return 404 for non-existent routes", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/nonexistent")
    );

    expect(response.status).toBe(404);
  });

  it("should handle multiple dynamic params", async () => {
    // Create nested dynamic route
    mkdirSync(join(testDir, "posts", "[postId]", "comments", "[commentId]"), {
      recursive: true,
    });
    writeFileSync(
      join(testDir, "posts", "[postId]", "comments", "[commentId]", "get.ts"),
      `export default async ({ params }: any) => ({ postId: params.postId, commentId: params.commentId });`
    );

    // Recreate app to pick up new route
    app = new Elysia();
    app.use(
      await nnnRouterPlugin({
        dir: "tests/fixtures/routes",
        prefix: "api",
      })
    );

    const response = await app.handle(
      new Request("http://localhost/api/posts/1/comments/2")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ postId: "1", commentId: "2" });
  });
});

