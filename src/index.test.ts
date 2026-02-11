import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "./index";
import path from "path";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";

const TEST_ROUTES_DIR = path.join(process.cwd(), "test-routes");

// Helper to create app (supports all plugin options)
const createApp = (
  options: Parameters<typeof nnnRouterPlugin>[0] = {}
) => {
  const app = new Elysia().use(nnnRouterPlugin(options));
  return app;
};

describe("elysia-nnn-router", () => {
  beforeAll(() => {
    // Tạo thư mục test routes
    if (existsSync(TEST_ROUTES_DIR)) {
      rmSync(TEST_ROUTES_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_ROUTES_DIR, { recursive: true });
  });

  afterAll(() => {
    // Xóa thư mục test routes
    if (existsSync(TEST_ROUTES_DIR)) {
      rmSync(TEST_ROUTES_DIR, { recursive: true, force: true });
    }
  });

  describe("Route Registration", () => {
    it("nên đăng ký route GET đơn giản", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "simple");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: () => ({ message: "GET simple" }) };`
      );

      // Test - dir trỏ đến test-routes, file ở test-routes/simple/get.ts
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(new Request("http://localhost/simple"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: "GET simple" });

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên đăng ký route POST", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "users");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "post.ts"),
        `module.exports = { default: ({ body }) => ({ message: "User created", data: body }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test User" }),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("User created");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên xử lý dynamic routes với params", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "products", "[id]");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: ({ params }) => ({ id: params.id }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/products/123")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("123");

      rmSync(path.join(TEST_ROUTES_DIR, "products"), {
        recursive: true,
        force: true,
      });
    });

    it("nên hỗ trợ nested dynamic routes", async () => {
      // Setup
      const routeDir = path.join(
        TEST_ROUTES_DIR,
        "posts",
        "[postId]",
        "comments",
        "[commentId]"
      );
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: ({ params }) => ({ 
          postId: params.postId, 
          commentId: params.commentId 
        }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/posts/1/comments/2")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.postId).toBe("1");
      expect(data.commentId).toBe("2");

      rmSync(path.join(TEST_ROUTES_DIR, "posts"), {
        recursive: true,
        force: true,
      });
    });
  });

  describe("Prefix Support", () => {
    it("nên thêm prefix vào tất cả routes", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "api-test");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: () => ({ message: "API route" }) };`
      );

      // Test
      const app = createApp({
        dir: "test-routes",
        prefix: "/api",
      });

      const response = await app.handle(
        new Request("http://localhost/api/api-test")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("API route");

      rmSync(routeDir, { recursive: true, force: true });
    });
  });

  describe("HTTP Methods", () => {
    it("nên hỗ trợ tất cả HTTP methods", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "methods");
      mkdirSync(routeDir, { recursive: true });

      const methods = ["get", "post", "put", "delete", "patch", "options"];

      methods.forEach((method) => {
        writeFileSync(
          path.join(routeDir, `${method}.ts`),
          `module.exports = { default: () => ({ method: "${method.toUpperCase()}" }) };`
        );
      });

      // Test
      const app = createApp({ dir: "test-routes" });

      for (const method of methods) {
        const response = await app.handle(
          new Request("http://localhost/methods", {
            method: method.toUpperCase(),
          })
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.method).toBe(method.toUpperCase());
      }

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên bỏ qua files không phải HTTP method", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "invalid");
      mkdirSync(routeDir, { recursive: true });

      // File không phải method
      writeFileSync(
        path.join(routeDir, "helper.ts"),
        `module.exports = { default: () => ({ message: "Should be ignored" }) };`
      );

      // File hợp lệ
      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: () => ({ message: "Valid GET" }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      // Route hợp lệ nên hoạt động
      const validResponse = await app.handle(
        new Request("http://localhost/invalid")
      );
      expect(validResponse.status).toBe(200);

      // Route không hợp lệ nên không tồn tại
      const invalidResponse = await app.handle(
        new Request("http://localhost/invalid/helper")
      );
      expect(invalidResponse.status).toBe(404);

      rmSync(routeDir, { recursive: true, force: true });
    });
  });

  describe("Middleware Support", () => {
    it("nên áp dụng root middleware", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "with-mw");
      mkdirSync(routeDir, { recursive: true });

      // Tạo middleware ở root
      writeFileSync(
        path.join(TEST_ROUTES_DIR, "_middleware.ts"),
        `module.exports = {
  default: [
    (context) => {
      context.customHeader = "root-middleware";
    }
  ]
};`
      );

      // Tạo route
      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: (context) => ({ header: context.customHeader }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/with-mw")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.header).toBe("root-middleware");

      // Cleanup
      rmSync(path.join(TEST_ROUTES_DIR, "_middleware.ts"));
      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên áp dụng nested middleware", async () => {
      // Cleanup middleware từ test trước (nếu có)
      const rootMwPath = path.join(TEST_ROUTES_DIR, "_middleware.ts");
      if (existsSync(rootMwPath)) {
        rmSync(rootMwPath);
      }

      // Setup
      const nestedDir = path.join(TEST_ROUTES_DIR, "admin");
      mkdirSync(nestedDir, { recursive: true });

      // Root middleware
      writeFileSync(
        path.join(TEST_ROUTES_DIR, "_middleware.ts"),
        `module.exports = {
  default: [
    (context) => {
      context.rootMw = true;
    }
  ]
};`
      );

      // Nested middleware
      writeFileSync(
        path.join(nestedDir, "_middleware.ts"),
        `module.exports = {
  default: [
    (context) => {
      context.nestedMw = true;
    }
  ]
};`
      );

      // Route
      writeFileSync(
        path.join(nestedDir, "get.ts"),
        `module.exports = { default: (context) => ({ rootMw: context.rootMw, nestedMw: context.nestedMw }) };`
      );

      // Clear require cache để đảm bảo middleware mới được load
      const mwPath1 = path.resolve(TEST_ROUTES_DIR, "_middleware.ts");
      const mwPath2 = path.resolve(nestedDir, "_middleware.ts");
      delete require.cache[mwPath1];
      delete require.cache[mwPath2];

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(new Request("http://localhost/admin"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rootMw).toBe(true);
      expect(data.nestedMw).toBe(true);

      // Cleanup
      rmSync(path.join(TEST_ROUTES_DIR, "_middleware.ts"));
      rmSync(nestedDir, { recursive: true, force: true });
    });
  });

  describe("Edge Cases", () => {
    it("nên xử lý khi thư mục routes không tồn tại", async () => {
      // Test với thư mục không tồn tại - không nên throw error
      const app = createApp({
        dir: "non-existent-directory",
      });

      // Không nên crash
      expect(app).toBeDefined();
    });

    it("nên xử lý multiple routes trong cùng thư mục", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "multi");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: () => ({ method: "GET" }) };`
      );
      writeFileSync(
        path.join(routeDir, "post.ts"),
        `module.exports = { default: () => ({ method: "POST" }) };`
      );
      writeFileSync(
        path.join(routeDir, "put.ts"),
        `module.exports = { default: () => ({ method: "PUT" }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const getRes = await app.handle(new Request("http://localhost/multi"));
      const getData = await getRes.json();
      expect(getData.method).toBe("GET");

      const postRes = await app.handle(
        new Request("http://localhost/multi", { method: "POST" })
      );
      const postData = await postRes.json();
      expect(postData.method).toBe("POST");

      const putRes = await app.handle(
        new Request("http://localhost/multi", { method: "PUT" })
      );
      const putData = await putRes.json();
      expect(putData.method).toBe("PUT");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên xử lý deeply nested routes", async () => {
      // Setup
      const routeDir = path.join(
        TEST_ROUTES_DIR,
        "api",
        "v1",
        "users",
        "[userId]",
        "posts",
        "[postId]"
      );
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: ({ params }) => ({ 
          userId: params.userId, 
          postId: params.postId 
        }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/api/v1/users/user123/posts/post456")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.userId).toBe("user123");
      expect(data.postId).toBe("post456");

      rmSync(path.join(TEST_ROUTES_DIR, "api"), {
        recursive: true,
        force: true,
      });
    });

    it("nên nạp route tĩnh trước route động cùng cấp (static trước [id])", async () => {
      // users/[id], users/top, users/block -> route động nạp cuối để không đè route tĩnh
      const usersDir = path.join(TEST_ROUTES_DIR, "users");
      const idDir = path.join(usersDir, "[id]");
      const topDir = path.join(usersDir, "top");
      const blockDir = path.join(usersDir, "block");
      mkdirSync(idDir, { recursive: true });
      mkdirSync(topDir, { recursive: true });
      mkdirSync(blockDir, { recursive: true });

      writeFileSync(
        path.join(idDir, "get.js"),
        `module.exports = { default: ({ params }) => ({ type: "dynamic", id: params.id }) };`
      );
      writeFileSync(
        path.join(topDir, "get.js"),
        `module.exports = { default: () => ({ type: "static", path: "top" }) };`
      );
      writeFileSync(
        path.join(blockDir, "get.js"),
        `module.exports = { default: () => ({ type: "static", path: "block" }) };`
      );

      // Clear require cache để đảm bảo load module mới
      const idPath = path.resolve(path.join(idDir, "get.js"));
      const topPath = path.resolve(path.join(topDir, "get.js"));
      const blockPath = path.resolve(path.join(blockDir, "get.js"));
      delete require.cache[idPath];
      delete require.cache[topPath];
      delete require.cache[blockPath];

      const app = createApp({ dir: "test-routes" });

      // Test route tĩnh /users/top - phải match với route tĩnh, không phải dynamic
      const topRes = await app.handle(new Request("http://localhost/users/top"));
      expect(topRes.status).toBe(200);
      const topData = await topRes.json();
      expect(topData.type).toBe("static");
      expect(topData.path).toBe("top");

      // Test route tĩnh /users/block - phải match với route tĩnh, không phải dynamic
      const blockRes = await app.handle(
        new Request("http://localhost/users/block")
      );
      expect(blockRes.status).toBe(200);
      const blockData = await blockRes.json();
      expect(blockData.type).toBe("static");
      expect(blockData.path).toBe("block");

      // Test route động /users/123 - phải match với route động
      const dynamicRes = await app.handle(
        new Request("http://localhost/users/123")
      );
      expect(dynamicRes.status).toBe(200);
      const dynamicData = await dynamicRes.json();
      expect(dynamicData.type).toBe("dynamic");
      expect(dynamicData.id).toBe("123");

      // Test route động /users/456 - phải match với route động
      const dynamicRes2 = await app.handle(
        new Request("http://localhost/users/456")
      );
      expect(dynamicRes2.status).toBe(200);
      const dynamicData2 = await dynamicRes2.json();
      expect(dynamicData2.type).toBe("dynamic");
      expect(dynamicData2.id).toBe("456");

      rmSync(path.join(TEST_ROUTES_DIR, "users"), {
        recursive: true,
        force: true,
      });
    });
  });

  describe("Method-Level Middleware", () => {
    it("nên áp dụng single method middleware", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "method-mw-single");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "post.ts"),
        `module.exports = {
  middleware: (context) => {
    context.methodMw = "applied";
  },
  default: (context) => ({
    message: "Post created",
    methodMw: context.methodMw
  })
};`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/method-mw-single", {
          method: "POST",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.methodMw).toBe("applied");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên áp dụng multiple method middlewares", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "method-mw-multiple");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "post.ts"),
        `module.exports = {
  middleware: [
    (context) => {
      context.mw1 = "first";
    },
    (context) => {
      context.mw2 = "second";
    },
    (context) => {
      context.mw3 = "third";
    }
  ],
  default: (context) => ({
    mw1: context.mw1,
    mw2: context.mw2,
    mw3: context.mw3
  })
};`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/method-mw-multiple", {
          method: "POST",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mw1).toBe("first");
      expect(data.mw2).toBe("second");
      expect(data.mw3).toBe("third");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên xử lý method middleware với error response", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "method-mw-error");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "post.ts"),
        `module.exports = {
  middleware: ({ body, error }) => {
    if (!body || !body.email) {
      return error(400, { message: "Email is required" });
    }
  },
  default: ({ body }) => ({
    message: "Success",
    email: body.email
  })
};`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      // Test without email - should fail
      const failResponse = await app.handle(
        new Request("http://localhost/method-mw-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test" }),
        })
      );
      const failData = await failResponse.json();

      expect(failResponse.status).toBe(400);
      expect(failData.message).toBe("Email is required");

      // Test with email - should succeed
      const successResponse = await app.handle(
        new Request("http://localhost/method-mw-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        })
      );
      const successData = await successResponse.json();

      expect(successResponse.status).toBe(200);
      expect(successData.message).toBe("Success");
      expect(successData.email).toBe("test@example.com");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên kết hợp directory middleware và method middleware", async () => {
      // Cleanup previous middleware
      const rootMwPath = path.join(TEST_ROUTES_DIR, "_middleware.ts");
      if (existsSync(rootMwPath)) {
        rmSync(rootMwPath);
      }

      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "combined-mw");
      mkdirSync(routeDir, { recursive: true });

      // Directory middleware
      writeFileSync(
        path.join(routeDir, "_middleware.ts"),
        `module.exports = {
  default: (context) => {
    context.dirMw = "directory";
  }
};`
      );

      // Route with method middleware
      writeFileSync(
        path.join(routeDir, "post.ts"),
        `module.exports = {
  middleware: (context) => {
    context.methodMw = "method";
  },
  default: (context) => ({
    dirMw: context.dirMw,
    methodMw: context.methodMw
  })
};`
      );

      // Clear require cache
      const mwPath = path.resolve(routeDir, "_middleware.ts");
      delete require.cache[mwPath];

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/combined-mw", {
          method: "POST",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dirMw).toBe("directory");
      expect(data.methodMw).toBe("method");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên validate với multiple method middlewares", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "method-mw-validate");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "post.ts"),
        `module.exports = {
  middleware: [
    ({ body, error }) => {
      if (!body.email || !body.name) {
        return error(400, { message: "Email and name are required" });
      }
    },
    ({ body, error }) => {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return error(400, { message: "Invalid email format" });
      }
    },
    ({ body, error }) => {
      if (body.name.length < 3) {
        return error(400, { message: "Name must be at least 3 characters" });
      }
    }
  ],
  default: ({ body }) => ({
    message: "User created successfully",
    data: body
  })
};`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      // Test 1: Missing fields
      const missingResponse = await app.handle(
        new Request("http://localhost/method-mw-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );
      const missingData = await missingResponse.json();
      expect(missingResponse.status).toBe(400);
      expect(missingData.message).toBe("Email and name are required");

      // Test 2: Invalid email
      const invalidEmailResponse = await app.handle(
        new Request("http://localhost/method-mw-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "invalid", name: "John" }),
        })
      );
      const invalidEmailData = await invalidEmailResponse.json();
      expect(invalidEmailResponse.status).toBe(400);
      expect(invalidEmailData.message).toBe("Invalid email format");

      // Test 3: Short name
      const shortNameResponse = await app.handle(
        new Request("http://localhost/method-mw-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com", name: "Jo" }),
        })
      );
      const shortNameData = await shortNameResponse.json();
      expect(shortNameResponse.status).toBe(400);
      expect(shortNameData.message).toBe("Name must be at least 3 characters");

      // Test 4: Valid data
      const validResponse = await app.handle(
        new Request("http://localhost/method-mw-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com", name: "John" }),
        })
      );
      const validData = await validResponse.json();
      expect(validResponse.status).toBe(200);
      expect(validData.message).toBe("User created successfully");
      expect(validData.data.email).toBe("test@example.com");
      expect(validData.data.name).toBe("John");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên áp dụng method middleware theo đúng thứ tự cascading", async () => {
      // Cleanup previous middleware
      const rootMwPath = path.join(TEST_ROUTES_DIR, "_middleware.ts");
      if (existsSync(rootMwPath)) {
        rmSync(rootMwPath);
      }

      // Setup
      const parentDir = path.join(TEST_ROUTES_DIR, "cascade-test");
      const childDir = path.join(parentDir, "child");
      mkdirSync(childDir, { recursive: true });

      // Root middleware
      writeFileSync(
        path.join(TEST_ROUTES_DIR, "_middleware.ts"),
        `module.exports = {
  default: (context) => {
    context.order = ["root"];
  }
};`
      );

      // Parent middleware
      writeFileSync(
        path.join(parentDir, "_middleware.ts"),
        `module.exports = {
  default: (context) => {
    context.order.push("parent");
  }
};`
      );

      // Child middleware
      writeFileSync(
        path.join(childDir, "_middleware.ts"),
        `module.exports = {
  default: (context) => {
    context.order.push("child");
  }
};`
      );

      // Route with method middleware
      writeFileSync(
        path.join(childDir, "get.ts"),
        `module.exports = {
  middleware: (context) => {
    context.order.push("method");
  },
  default: (context) => ({
    order: context.order
  })
};`
      );

      // Clear require cache
      [
        path.resolve(TEST_ROUTES_DIR, "_middleware.ts"),
        path.resolve(parentDir, "_middleware.ts"),
        path.resolve(childDir, "_middleware.ts"),
      ].forEach((p) => delete require.cache[p]);

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/cascade-test/child")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.order).toEqual(["root", "parent", "child", "method"]);

      // Cleanup
      rmSync(path.join(TEST_ROUTES_DIR, "_middleware.ts"));
      rmSync(parentDir, { recursive: true, force: true });
    });
  });

  describe("Async Middleware & Error Handling", () => {
    it("nên xử lý async middleware", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "async-mw");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "_middleware.ts"),
        `module.exports = {
  default: async (context) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    context.asyncData = "loaded";
  }
};`
      );

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: (context) => ({ data: context.asyncData }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/async-mw")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBe("loaded");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên xử lý errors trong async middleware", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "async-mw-error");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "_middleware.ts"),
        `module.exports = {
  default: async ({ error }) => {
    return error(403, { message: "Async middleware rejected" });
  }
};`
      );

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: () => ({ message: "Should not reach here" }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/async-mw-error")
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.message).toBe("Async middleware rejected");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên xử lý async route handler", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "async-handler");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { 
          default: async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return { message: "Async handler executed" };
          }
        };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/async-handler")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Async handler executed");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên xử lý route handler với custom error", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "handler-error");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { 
          default: ({ error }) => {
            return error(404, { message: "Resource not found" });
          }
        };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/handler-error")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe("Resource not found");

      rmSync(routeDir, { recursive: true, force: true });
    });
  });

  describe("Complex Scenarios", () => {
    it("nên hoạt động với prefix và nested routes", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "v2", "users", "[id]");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: ({ params }) => ({ id: params.id, version: "v2" }) };`
      );

      // Test
      const app = createApp({
        dir: "test-routes",
        prefix: "/api",
      });

      const response = await app.handle(
        new Request("http://localhost/api/v2/users/789")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("789");
      expect(data.version).toBe("v2");

      rmSync(path.join(TEST_ROUTES_DIR, "v2"), {
        recursive: true,
        force: true,
      });
    });

    it("nên xử lý route với query params", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "search");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: ({ query }) => ({ query }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(
        new Request("http://localhost/search?q=test&page=1")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query.q).toBe("test");
      expect(data.query.page).toBe("1");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên xử lý route trả về status code khác", async () => {
      // Setup
      const routeDir = path.join(TEST_ROUTES_DIR, "status");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { 
          default: ({ set }) => {
            set.status = 201;
            return { message: "Created" };
          }
        };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(new Request("http://localhost/status"));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe("Created");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("nên xử lý route tại root path", async () => {
      // Setup - file ngay trong test-routes
      writeFileSync(
        path.join(TEST_ROUTES_DIR, "get.ts"),
        `module.exports = { default: () => ({ message: "Root route" }) };`
      );

      // Test
      const app = createApp({ dir: "test-routes" });

      const response = await app.handle(new Request("http://localhost/"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Root route");

      rmSync(path.join(TEST_ROUTES_DIR, "get.ts"));
    });

    it("nên xử lý tất cả HTTP methods tại root path (path='/')", async () => {
      // Setup - tạo tất cả method files ở root
      const methods = ["get", "post", "put", "delete", "patch", "options"];

      methods.forEach((method) => {
        const filePath = path.join(TEST_ROUTES_DIR, `${method}.ts`);
        writeFileSync(
          filePath,
          `module.exports = { default: () => ({ method: "${method.toUpperCase()}", path: "/" }) };`
        );
        // Clear require cache để đảm bảo module mới được load
        delete require.cache[path.resolve(filePath)];
      });

      // Test
      const app = createApp({ dir: "test-routes" });

      for (const method of methods) {
        const response = await app.handle(
          new Request("http://localhost/", {
            method: method.toUpperCase(),
          })
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.method).toBe(method.toUpperCase());
        expect(data.path).toBe("/");
      }

      // Cleanup
      methods.forEach((method) => {
        rmSync(path.join(TEST_ROUTES_DIR, `${method}.ts`));
      });
    });
  });

  describe("Phase 1 & 2: Error handling, validation, options", () => {
    it("should not crash when a route file throws on load and should skip that route", async () => {
      const routeDir = path.join(TEST_ROUTES_DIR, "error-load");
      mkdirSync(routeDir, { recursive: true });

      // File that throws when required
      writeFileSync(
        path.join(routeDir, "get.ts"),
        `throw new Error("intentional load error");`
      );
      writeFileSync(
        path.join(routeDir, "post.ts"),
        `module.exports = { default: () => ({ ok: true }) };`
      );

      const app = createApp({
        dir: "test-routes",
        onError: () => {}, // swallow log in test output
      });

      // App should be defined (no crash)
      expect(app).toBeDefined();

      // Valid route should work
      const res = await app.handle(
        new Request("http://localhost/error-load", { method: "POST" })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);

      // Failed route should not be registered (404)
      const getRes = await app.handle(new Request("http://localhost/error-load"));
      expect(getRes.status).toBe(404);

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("should call onError when a route file fails to load", async () => {
      const routeDir = path.join(TEST_ROUTES_DIR, "onerror-route");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `throw new Error("load failed");`
      );

      const errors: { error: Error; filePath: string }[] = [];
      const app = createApp({
        dir: "test-routes",
        onError: (error, filePath) => {
          errors.push({ error, filePath });
        },
      });

      expect(app).toBeDefined();
      expect(errors.length).toBe(1);
      expect(errors[0].error.message).toContain("load failed");
      expect(errors[0].filePath).toContain("get.ts");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("should skip route when default export is missing and not crash", async () => {
      const routeDir = path.join(TEST_ROUTES_DIR, "no-default");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = {};`
      );

      const app = createApp({
        dir: "test-routes",
        onError: () => {}, // swallow warn in test output
      });

      expect(app).toBeDefined();
      const res = await app.handle(new Request("http://localhost/no-default"));
      expect(res.status).toBe(404);

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("should skip route when default export is not a function and call onError", async () => {
      const routeDir = path.join(TEST_ROUTES_DIR, "default-not-fn");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: "not a function" };`
      );

      const errors: { error: Error; filePath: string }[] = [];
      const app = createApp({
        dir: "test-routes",
        onError: (error, filePath) => {
          errors.push({ error, filePath });
        },
      });

      expect(app).toBeDefined();
      expect(errors.length).toBe(1);
      expect(errors[0].error.message).toContain("default function");
      expect(errors[0].filePath).toContain("get.ts");

      const res = await app.handle(
        new Request("http://localhost/default-not-fn")
      );
      expect(res.status).toBe(404);

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("should normalize prefix with double slash and trailing slash", async () => {
      const routeDir = path.join(TEST_ROUTES_DIR, "norm");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: () => ({ message: "normalized" }) };`
      );

      const app = createApp({
        dir: "test-routes",
        prefix: "//api/v1/",
      });

      const res = await app.handle(new Request("http://localhost/api/v1/norm"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe("normalized");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("should log verbose table with relative file paths when verbose is true", async () => {
      const routeDir = path.join(TEST_ROUTES_DIR, "verbose-table");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: () => ({ ok: true }) };`
      );

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        logs.push(args.map(String).join(" "));
      };

      createApp({
        dir: "test-routes",
        verbose: true,
      });

      console.log = originalLog;

      const tableText = logs.join("\n");
      expect(tableText).toContain("[elysia-nnn-router] Registered routes");
      expect(tableText).toContain("Method");
      expect(tableText).toContain("Path");
      expect(tableText).toContain("File");
      expect(tableText).toContain("GET");
      expect(tableText).toContain("verbose-table");
      // File column should be relative to routes dir (path sep may be / or \)
      expect(tableText).toMatch(/verbose-table[\\/]get\.ts/);
      expect(tableText).not.toMatch(/\/home\/[^\s]+\/verbose-table/);

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("should not log verbose table when silent is true", async () => {
      const routeDir = path.join(TEST_ROUTES_DIR, "silent-test");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: () => ({ ok: true }) };`
      );

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        logs.push(args.map(String).join(" "));
      };

      createApp({
        dir: "test-routes",
        silent: true,
        verbose: true,
      });

      console.log = originalLog;

      const tableText = logs.join("\n");
      expect(tableText).not.toContain("[elysia-nnn-router] Registered routes");

      rmSync(routeDir, { recursive: true, force: true });
    });

    it("should call onError when middleware file fails to load", async () => {
      const routeDir = path.join(TEST_ROUTES_DIR, "mw-error");
      mkdirSync(routeDir, { recursive: true });

      writeFileSync(
        path.join(routeDir, "_middleware.ts"),
        `throw new Error("middleware load error");`
      );
      writeFileSync(
        path.join(routeDir, "get.ts"),
        `module.exports = { default: () => ({ ok: true }) };`
      );

      const errors: { error: Error; filePath: string }[] = [];
      const app = createApp({
        dir: "test-routes",
        onError: (error, filePath) => {
          errors.push({ error, filePath });
        },
      });

      expect(app).toBeDefined();
      expect(errors.some((e) => e.filePath.includes("_middleware"))).toBe(
        true
      );
      expect(errors.some((e) => e.error.message.includes("middleware"))).toBe(
        true
      );

      // Route should still work (middleware just skipped)
      const res = await app.handle(new Request("http://localhost/mw-error"));
      expect(res.status).toBe(200);

      rmSync(routeDir, { recursive: true, force: true });
    });
  });
});
