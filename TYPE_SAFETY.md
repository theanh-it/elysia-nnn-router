# 🔒 Type Safety Guide

Complete guide to type-safe development with `elysia-nnn-router`.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Branded Types](#branded-types)
3. [Type Inference](#type-inference)
4. [Route Context Types](#route-context-types)
5. [Middleware Types](#middleware-types)
6. [Advanced Patterns](#advanced-patterns)
7. [Best Practices](#best-practices)
8. [TypeScript Configuration](#typescript-configuration)

---

## Overview

`elysia-nnn-router` provides comprehensive type safety through:

- ✅ **Generic Route Context** - Fully typed request/response
- ✅ **Schema Type Inference** - Auto-infer types from Zod schemas
- ✅ **Branded Types** - Prevent ID mixing at compile-time
- ✅ **Strict TypeScript Config** - Catch errors early
- ✅ **Zero Runtime Overhead** - Types are compile-time only

---

## Branded Types

### What are Branded Types?

Branded types create "nominal" types in TypeScript, preventing accidental mixing of similar types:

```typescript
import type { UserId, PostId, SessionToken } from "elysia-nnn-router";
import { brand } from "elysia-nnn-router";

const userId = brand<string, "UserId">("user-123");
const postId = brand<string, "PostId">("post-456");
const token = brand<string, "SessionToken">("token-789");

// ✅ Type-safe function
function getUserData(id: UserId) {
  return { id, name: "John" };
}

getUserData(userId);  // ✅ Works
getUserData(postId);  // ❌ TypeScript error!
getUserData("raw");   // ❌ TypeScript error!
```

###Built-in Branded Types

```typescript
// Available out of the box
type UserId = Brand<string, "UserId">;
type PostId = Brand<string, "PostId">;
type SessionToken = Brand<string, "SessionToken">;
```

### Creating Custom Branded Types

```typescript
import type { Brand } from "elysia-nnn-router";
import { brand } from "elysia-nnn-router";

// Define custom branded types
type Email = Brand<string, "Email">;
type PhoneNumber = Brand<string, "PhoneNumber">;
type ProductSKU = Brand<string, "ProductSKU">;

// Create branded values
const email: Email = brand<string, "Email">("user@example.com");
const phone: PhoneNumber = brand<string, "PhoneNumber">("+1234567890");
const sku: ProductSKU = brand<string, "ProductSKU">("PROD-001");

// Type-safe API
function sendEmail(to: Email, subject: string) {
  // ...
}

sendEmail(email, "Hello");  // ✅ Works
sendEmail(phone, "Hello");  // ❌ Error: PhoneNumber ≠ Email
```

### Benefits

```typescript
// Without branded types
function getUser(id: string) { /* ... */ }
function getPost(id: string) { /* ... */ }

const userId = "123";
const postId = "456";

getUser(postId);  // ⚠️ Bug! But TypeScript allows it

// With branded types
function getUserBranded(id: UserId) { /* ... */ }
function getPostBranded(id: PostId) { /* ... */ }

const userIdBranded = brand<string, "UserId">("123");
const postIdBranded = brand<string, "PostId">("456");

getUserBranded(postIdBranded);  // ❌ TypeScript catches the bug!
```

---

## Type Inference

### Automatic Type Inference from Zod

The router automatically infers TypeScript types from your Zod schemas:

```typescript
import { z } from "zod";
import type { InferSchema } from "elysia-nnn-router";

// Define Zod schema
const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().int().min(18),
  role: z.enum(["user", "admin"]),
});

// TypeScript automatically knows the shape
type User = InferSchema<typeof userSchema>;
// Infers: { name: string; email: string; age: number; role: "user" | "admin" }

// Use in your code
const user: User = {
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  role: "admin",
};
```

### Inferring All Route Types

```typescript
import type { InferRouteTypes } from "elysia-nnn-router";

const schema = {
  body: z.object({ username: z.string() }),
  query: z.object({ page: z.string() }),
  params: z.object({ id: z.string() }),
  headers: z.object({ authorization: z.string() }),
};

// Infer all types at once
type RouteTypes = InferRouteTypes<typeof schema>;
// {
//   body: { username: string };
//   query: { page: string };
//   params: { id: string };
//   headers: { authorization: string };
// }
```

### Complex Type Inference

```typescript
// Nested objects
const complexSchema = z.object({
  user: z.object({
    profile: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
    settings: z.object({
      notifications: z.boolean(),
    }),
  }),
  metadata: z.record(z.string()),
});

type Complex = InferSchema<typeof complexSchema>;
// Fully typed nested structure!

// Arrays
const arraySchema = z.object({
  tags: z.array(z.string()),
  scores: z.array(z.number()),
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
});

type Arrays = InferSchema<typeof arraySchema>;

// Optional & Nullable
const optionalSchema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  nullable: z.string().nullable(),
  both: z.string().nullable().optional(),
});

type Optional = InferSchema<typeof optionalSchema>;
// {
//   required: string;
//   optional?: string;
//   nullable: string | null;
//   both?: string | null;
// }

// Union types
const unionSchema = z.union([
  z.object({ type: z.literal("text"), content: z.string() }),
  z.object({ type: z.literal("image"), url: z.string() }),
]);

type Union = InferSchema<typeof unionSchema>;
// { type: "text"; content: string } | { type: "image"; url: string }
```

---

## Route Context Types

### Type-Safe Route Context

Use `RouteContext` for fully typed route handlers:

```typescript
import type { RouteContext } from "elysia-nnn-router";
import { z } from "zod";

// Define your schema
export const schema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  query: z.object({
    remember: z.string().optional(),
  }),
};

// Type-safe handler
export default async (ctx: RouteContext<typeof schema>) => {
  // TypeScript knows all these types!
  const { email, password } = ctx.body; // ✅ { email: string; password: string }
  const remember = ctx.query.remember;  // ✅ string | undefined

  // Autocomplete works!
  ctx.body.email;      // ✅ Suggested by IDE
  ctx.body.unknown;    // ❌ TypeScript error!
  
  // Type-safe response
  return {
    success: true,
    user: {
      email,  // ✅ Known to be string
    },
  };
};
```

### Full Context Properties

```typescript
interface RouteContext<TSchema> {
  // Inferred from schema
  body: InferSchema<TSchema["body"]>;
  query: InferSchema<TSchema["query"]>;
  params: InferSchema<TSchema["params"]>;
  headers: InferSchema<TSchema["headers"]> & Record<string, string | undefined>;

  // Elysia context
  set: {
    status?: number;
    headers: Record<string, string | number>;
    redirect?: string;
  };
  request: Request;
  path: string;
  store: Record<string, unknown>;
  error: (code: number, message: string) => void;
  // ... more Elysia properties
}
```

### Using Context in Functions

```typescript
import type { RouteContext } from "elysia-nnn-router";

const schema = {
  body: z.object({ age: z.number().int() }),
};

// Type-safe helper function
function validateAge(ctx: RouteContext<typeof schema>): boolean {
  return ctx.body.age >= 18;  // ✅ TypeScript knows age is number
}

export default async (ctx: RouteContext<typeof schema>) => {
  if (!validateAge(ctx)) {
    ctx.set.status = 400;
    return { error: "Must be 18 or older" };
  }

  return { success: true };
};
```

---

## Middleware Types

### Type-Safe Middleware

```typescript
import type { RouteMiddleware } from "elysia-nnn-router";

// Simple middleware
export const loggerMiddleware: RouteMiddleware = async (context) => {
  console.log(`${context.request.method} ${context.path}`);
};

// Middleware with context modification
export const authMiddleware: RouteMiddleware = async (context) => {
  const token = context.headers.authorization;
  
  if (!token) {
    context.set.status = 401;
    return { error: "Unauthorized" };
  }

  // Add user to context (for next handlers)
  return {
    user: { id: "123", name: "John" },
  };
};
```

### Middleware Arrays

```typescript
import type { RouteMiddleware } from "elysia-nnn-router";

// Single middleware
export const middleware: RouteMiddleware = async (ctx) => {
  // ...
};

// Array of middlewares
export const middleware: RouteMiddleware[] = [
  async (ctx) => { /* auth */ },
  async (ctx) => { /* logging */ },
  async (ctx) => { /* validation */ },
];
```

---

## Advanced Patterns

### Generic Route Handlers

```typescript
import type { RouteContext, RouteHandler } from "elysia-nnn-router";
import { z } from "zod";

// Generic CRUD handler type
type CRUDHandler<T extends z.ZodTypeAny> = RouteHandler<{
  body: T;
}>;

// Reusable create handler
function createResourceHandler<T extends z.ZodTypeAny>(
  schema: T,
  createFn: (data: z.infer<T>) => Promise<any>
): CRUDHandler<T> {
  return async (ctx: RouteContext<{ body: T }>) => {
    const result = await createFn(ctx.body);
    return { success: true, data: result };
  };
}

// Usage
const userSchema = z.object({ name: z.string(), email: z.string() });

export default createResourceHandler(userSchema, async (data) => {
  // data is fully typed!
  return { id: "123", ...data };
});
```

### Discriminated Unions

```typescript
import { z } from "zod";

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create"),
    data: z.object({ name: z.string() }),
  }),
  z.object({
    type: z.literal("update"),
    id: z.string(),
    data: z.object({ name: z.string() }),
  }),
  z.object({
    type: z.literal("delete"),
    id: z.string(),
  }),
]);

export const schema = { body: actionSchema };

export default async (ctx: RouteContext<typeof schema>) => {
  const action = ctx.body;

  // TypeScript narrows the type based on discriminator
  switch (action.type) {
    case "create":
      return { created: action.data.name };  // ✅ data exists
    case "update":
      return { updated: action.id };  // ✅ id exists
    case "delete":
      return { deleted: action.id };  // ✅ id exists
  }
};
```

### Conditional Types

```typescript
// Type-safe response based on input
type CreateResponse<T> = T extends { admin: true }
  ? { success: true; adminData: unknown }
  : { success: true; userData: unknown };

const schema = {
  body: z.object({
    name: z.string(),
    admin: z.boolean().optional(),
  }),
};

export default async (ctx: RouteContext<typeof schema>) => {
  if (ctx.body.admin) {
    return { success: true, adminData: {} } as CreateResponse<typeof ctx.body>;
  }
  return { success: true, userData: {} } as CreateResponse<typeof ctx.body>;
};
```

---

## Best Practices

### 1. Always Define Schemas

```typescript
// ❌ Bad: No schema, no type safety
export default async (ctx: any) => {
  const name = ctx.body.name;  // any type
};

// ✅ Good: Schema defined, full type safety
export const schema = {
  body: z.object({ name: z.string() }),
};

export default async (ctx: RouteContext<typeof schema>) => {
  const name = ctx.body.name;  // string type!
};
```

### 2. Use Branded Types for IDs

```typescript
import type { UserId, PostId } from "elysia-nnn-router";
import { brand } from "elysia-nnn-router";

// ❌ Bad: Can mix up IDs
function getUser(id: string) { }
function getPost(id: string) { }

const userId = "123";
const postId = "456";
getUser(postId);  // Oops! Bug

// ✅ Good: Type-safe IDs
function getUserSafe(id: UserId) { }
function getPostSafe(id: PostId) { }

const userIdSafe = brand<string, "UserId">("123");
const postIdSafe = brand<string, "PostId">("456");
getUserSafe(postIdSafe);  // ❌ TypeScript error!
```

### 3. Extract Complex Types

```typescript
// ❌ Bad: Inline complex types
export const schema = {
  body: z.object({
    user: z.object({
      profile: z.object({ /* complex */ }),
      settings: z.object({ /* complex */ }),
    }),
  }),
};

// ✅ Good: Extract and reuse
const profileSchema = z.object({ /* ... */ });
const settingsSchema = z.object({ /* ... */ });
const userSchema = z.object({
  profile: profileSchema,
  settings: settingsSchema,
});

export const schema = { body: userSchema };

// Bonus: Reuse types
export type Profile = z.infer<typeof profileSchema>;
export type Settings = z.infer<typeof settingsSchema>;
```

### 4. Type-Safe Error Handling

```typescript
import type { RouteContext } from "elysia-nnn-router";

type ErrorResponse = {
  error: string;
  code?: string;
  details?: unknown;
};

function createError(
  ctx: RouteContext<any>,
  status: number,
  message: string
): ErrorResponse {
  ctx.set.status = status;
  return { error: message };
}

export default async (ctx: RouteContext<typeof schema>) => {
  if (!ctx.body.email) {
    return createError(ctx, 400, "Email required");
  }

  return { success: true };
};
```

### 5. Document Types with JSDoc

```typescript
/**
 * User creation schema
 * @property {string} email - Valid email address
 * @property {string} password - Minimum 8 characters
 * @property {number} age - Must be 18 or older
 */
export const schema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    age: z.number().int().min(18),
  }),
};

/**
 * Creates a new user account
 * @returns Success response with user ID
 */
export default async (ctx: RouteContext<typeof schema>) => {
  // ...
};
```

---

## TypeScript Configuration

### Recommended tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    
    // Strict type checking (all enabled)
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### Why These Settings?

- **`strict: true`** - Enables all strict checks
- **`noImplicitAny`** - No `any` without explicit annotation
- **`strictNullChecks`** - Catch null/undefined errors
- **`noUnusedLocals`** - Remove dead code
- **`noUncheckedIndexedAccess`** - Safe array/object access

---

## Type Safety Checklist

- [ ] All routes have schemas defined
- [ ] Use `RouteContext<typeof schema>` in handlers
- [ ] Use branded types for IDs
- [ ] Enable strict TypeScript config
- [ ] No `any` types (use `unknown` if needed)
- [ ] Extract complex types for reuse
- [ ] Document types with JSDoc
- [ ] Test type inference with examples
- [ ] Review TypeScript errors in CI/CD

---

## Examples

See full working examples in:

- **Demo app:** `/demo/routes/`
- **Tests:** `/tests/unit/type-safety.test.ts`
- **Type definitions:** `/src/types.ts`

---

## Summary

Type safety in `elysia-nnn-router`:

✅ **Branded types** prevent ID mixing  
✅ **Schema inference** gives free types  
✅ **RouteContext** provides full typing  
✅ **Strict config** catches bugs early  
✅ **Zero overhead** - compile-time only  

**Result:** Write safer, more maintainable APIs with TypeScript's full power!

---

**Last Updated:** 2025-11-11  
**Version:** 0.2.0  
**Type Safety:** ⭐⭐⭐⭐⭐ Excellent

