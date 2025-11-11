import { describe, test, expect } from "bun:test";
import { z } from "zod";
import type {
  RouteContext,
  InferSchema,
  InferRouteTypes,
  Brand,
  UserId,
  PostId,
  SessionToken,
} from "../../src/types";
import { brand } from "../../src/types";

describe("Type Safety", () => {
  describe("Branded Types", () => {
    test("should create branded types", () => {
      const userId: UserId = brand<string, "UserId">("user-123");
      const postId: PostId = brand<string, "PostId">("post-456");
      const token: SessionToken = brand<string, "SessionToken">("token-789");

      expect(userId).toBe("user-123");
      expect(postId).toBe("post-456");
      expect(token).toBe("token-789");
    });

    test("branded types should be distinct at compile time", () => {
      // This test verifies TypeScript type checking
      // Runtime behavior is the same, but TypeScript prevents mixing types

      const userId = brand<string, "UserId">("123");
      const postId = brand<string, "PostId">("456");

      // These would be TypeScript errors (we can't test them here):
      // const wrongAssignment: UserId = postId; // Error!
      // const mixed: PostId = userId; // Error!

      // But runtime values work normally
      expect(typeof userId).toBe("string");
      expect(typeof postId).toBe("string");
    });

    test("can create custom branded types", () => {
      type Email = Brand<string, "Email">;
      type PhoneNumber = Brand<string, "PhoneNumber">;

      const email: Email = brand<string, "Email">("test@example.com");
      const phone: PhoneNumber = brand<string, "PhoneNumber">("+1234567890");

      expect(email).toBe("test@example.com");
      expect(phone).toBe("+1234567890");
    });
  });

  describe("Type Inference from Zod", () => {
    test("should infer type from Zod string schema", () => {
      const schema = z.string();
      type Inferred = InferSchema<typeof schema>;

      // TypeScript compilation validates this
      const value: Inferred = "test";
      expect(typeof value).toBe("string");
    });

    test("should infer type from Zod object schema", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });

      type Inferred = InferSchema<typeof schema>;

      // TypeScript validates the shape
      const value: Inferred = {
        name: "John",
        age: 30,
        email: "john@example.com",
      };

      expect(value.name).toBe("John");
      expect(value.age).toBe(30);
      expect(value.email).toBe("john@example.com");
    });

    test("should infer undefined when schema is undefined", () => {
      type Inferred = InferSchema<undefined>;

      // This is unknown type at runtime
      const value: Inferred = undefined;
      expect(value).toBeUndefined();
    });

    test("should handle optional fields", () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullable: z.string().nullable(),
      });

      type Inferred = InferSchema<typeof schema>;

      const value: Inferred = {
        required: "test",
        optional: undefined,
        nullable: null,
      };

      expect(value.required).toBe("test");
      expect(value.optional).toBeUndefined();
      expect(value.nullable).toBeNull();
    });
  });

  describe("Route Types Inference", () => {
    test("should infer all route types from schema", () => {
      const schema = {
        body: z.object({ name: z.string() }),
        query: z.object({ page: z.string() }),
        params: z.object({ id: z.string() }),
        headers: z.object({ authorization: z.string() }),
      };

      type RouteTypes = InferRouteTypes<typeof schema>;

      // TypeScript validates these shapes
      const types: RouteTypes = {
        body: { name: "test" },
        query: { page: "1" },
        params: { id: "123" },
        headers: { authorization: "Bearer token" },
      };

      expect(types.body.name).toBe("test");
      expect(types.query.page).toBe("1");
      expect(types.params.id).toBe("123");
      expect(types.headers.authorization).toBe("Bearer token");
    });

    test("should handle partial schemas", () => {
      const schema = {
        body: z.object({ name: z.string() }),
        // query, params, headers not defined
      };

      type RouteTypes = InferRouteTypes<typeof schema>;

      // Body is typed, others are unknown
      const types = {
        body: { name: "test" },
        query: undefined,
        params: undefined,
        headers: undefined,
      } as any as RouteTypes;

      expect(types.body.name).toBe("test");
    });
  });

  describe("RouteContext Type", () => {
    test("should properly type RouteContext", () => {
      const schema = {
        body: z.object({ email: z.string().email() }),
        query: z.object({ filter: z.string() }),
        params: z.object({ userId: z.string() }),
      };

      // This would be used in route handler
      type Context = RouteContext<typeof schema>;

      // Mock context (in real usage, Elysia provides this)
      const mockContext = {
        body: { email: "test@example.com" },
        query: { filter: "active" },
        params: { userId: "123" },
        headers: { "content-type": "application/json" },
        set: { status: 200, headers: {} },
        request: {} as Request,
      } as Context;

      expect(mockContext.body.email).toBe("test@example.com");
      expect(mockContext.query.filter).toBe("active");
      expect(mockContext.params.userId).toBe("123");
    });
  });

  describe("Type Safety Examples", () => {
    test("route handler with typed context", async () => {
      const schema = {
        body: z.object({
          username: z.string().min(3),
          password: z.string().min(8),
        }),
        query: z.object({
          remember: z.string().optional(),
        }),
      };

      type Context = RouteContext<typeof schema>;

      // Type-safe handler
      const handler = async (ctx: Context) => {
        // TypeScript knows these types!
        const { username, password } = ctx.body; // ✅ Typed
        const remember = ctx.query.remember; // ✅ Optional<string>

        expect(typeof username).toBe("string");
        expect(typeof password).toBe("string");

        return { success: true };
      };

      // Mock execution
      const mockCtx = {
        body: { username: "john", password: "password123" },
        query: { remember: "true" },
        params: {},
        headers: {},
        set: { status: 200, headers: {} },
        request: {} as Request,
      } as Context;

      const result = await handler(mockCtx);
      expect(result.success).toBe(true);
    });

    test("compile-time type checking prevents errors", () => {
      const schema = {
        body: z.object({
          age: z.number().int().min(18),
        }),
      };

      type Context = RouteContext<typeof schema>;

      // This function expects typed context
      const validateAge = (ctx: Context): boolean => {
        // TypeScript knows ctx.body.age is a number
        return ctx.body.age >= 18;
      };

      const mockCtx = {
        body: { age: 25 },
        query: {},
        params: {},
        headers: {},
        set: { status: 200, headers: {} },
        request: {} as Request,
      } as Context;

      expect(validateAge(mockCtx)).toBe(true);

      // These would be TypeScript errors (can't test runtime):
      // mockCtx.body.age = "25"; // Error: Type 'string' is not assignable
      // mockCtx.body.name; // Error: Property 'name' does not exist
    });

    test("type-safe branded IDs prevent mixing", () => {
      const userId = brand<string, "UserId">("user-123");
      const postId = brand<string, "PostId">("post-456");

      // Function that expects UserId
      const getUserData = (id: UserId) => {
        return { id, name: "John" };
      };

      const user = getUserData(userId); // ✅ Works
      expect(user.id).toBe("user-123");

      // getUserData(postId); // ❌ TypeScript error (compile-time)
      // getUserData("raw-string"); // ❌ TypeScript error
    });
  });

  describe("Advanced Type Safety", () => {
    test("nested objects with inference", () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            age: z.number(),
          }),
          settings: z.object({
            theme: z.enum(["light", "dark"]),
          }),
        }),
      });

      type Inferred = InferSchema<typeof schema>;

      const data: Inferred = {
        user: {
          profile: {
            name: "Alice",
            age: 28,
          },
          settings: {
            theme: "dark",
          },
        },
      };

      expect(data.user.profile.name).toBe("Alice");
      expect(data.user.settings.theme).toBe("dark");
    });

    test("arrays with inference", () => {
      const schema = z.object({
        tags: z.array(z.string()),
        scores: z.array(z.number()),
      });

      type Inferred = InferSchema<typeof schema>;

      const data: Inferred = {
        tags: ["typescript", "zod", "elysia"],
        scores: [95, 87, 92],
      };

      expect(data.tags).toHaveLength(3);
      expect(data.scores[0]).toBe(95);
    });

    test("union types with inference", () => {
      const schema = z.union([
        z.object({ type: z.literal("text"), content: z.string() }),
        z.object({ type: z.literal("number"), value: z.number() }),
      ]);

      type Inferred = InferSchema<typeof schema>;

      const textData: Inferred = { type: "text", content: "Hello" };
      const numberData: Inferred = { type: "number", value: 42 };

      expect(textData.type).toBe("text");
      expect(numberData.type).toBe("number");
    });
  });
});

