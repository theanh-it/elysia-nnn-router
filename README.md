# elysia-nnn-router

[![npm version](https://img.shields.io/npm/v/elysia-nnn-router.svg)](https://www.npmjs.com/package/elysia-nnn-router)
[![npm downloads](https://img.shields.io/npm/dm/elysia-nnn-router.svg)](https://www.npmjs.com/package/elysia-nnn-router)
[![license](https://img.shields.io/npm/l/elysia-nnn-router.svg)](https://github.com/theanh-it/elysia-nnn-router/blob/main/LICENSE)

**English** | [Tiếng Việt](./README.vi.md)

> **Current Version:** 0.1.0

A router plugin for Elysia framework that automatically scans and registers routes from directory structure with directory-level middleware support.

## Features

- 🚀 Automatic route scanning and registration from directory structure
- 🔄 Support all HTTP methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- 🎯 Dynamic routes with `[param]` syntax
- 🛡️ Middleware cascading through directory structure
- 🎪 Method-level middleware for route-specific logic
- ⚡ High performance with Bun
- 📦 TypeScript support

## Installation

```bash
bun add elysia-nnn-router
```

## Basic Usage

1. Create a `routes` directory in your project
2. Organize routes by directory structure:

```
routes/
  ├── _middleware.ts          # Global middleware
  ├── users/
  │   ├── _middleware.ts      # Users middleware
  │   ├── get.ts              # GET /users
  │   ├── post.ts             # POST /users
  │   └── [id]/
  │       ├── _middleware.ts  # User detail middleware
  │       ├── get.ts          # GET /users/:id
  │       ├── put.ts          # PUT /users/:id
  │       └── delete.ts       # DELETE /users/:id
  └── posts/
      ├── get.ts              # GET /posts
      └── post.ts             # POST /posts
```

3. Use the plugin in your application:

```typescript
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "elysia-nnn-router";

const app = new Elysia();

app.use(nnnRouterPlugin());

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
```

## Configuration Options

```typescript
app.use(
  nnnRouterPlugin({
    dir: "custom-routes", // Routes directory (default: "routes")
    prefix: "/api", // Prefix for all routes (default: "")
  })
);
```

### Example with prefix

```typescript
// With prefix: "/api"
// routes/users/get.ts -> GET /api/users
// routes/users/[id]/get.ts -> GET /api/users/:id
```

## Naming Conventions

### Route Files

Route file names must match HTTP methods (case-insensitive):

- `get.ts` or `get.js` → GET request
- `post.ts` or `post.js` → POST request
- `put.ts` or `put.js` → PUT request
- `delete.ts` or `delete.js` → DELETE request
- `patch.ts` or `patch.js` → PATCH request
- `options.ts` or `options.js` → OPTIONS request

### Dynamic Routes

Use `[param_name]` for dynamic routes:

```
routes/users/[id]/get.ts        → GET /users/:id
routes/posts/[slug]/get.ts      → GET /posts/:slug
routes/users/[id]/posts/get.ts  → GET /users/:id/posts
```

### Middleware

The `_middleware.ts` file in a directory applies to:

- All routes in that directory
- All routes in subdirectories

## Writing Route Handlers

Route handlers are functions exported as default:

```typescript
// routes/users/get.ts
export default () => {
  return { users: [] };
};

// routes/users/[id]/get.ts
export default ({ params }) => {
  return { id: params.id };
};

// routes/users/post.ts
export default ({ body }) => {
  return { message: "User created", data: body };
};
```

### With async handler

```typescript
// routes/users/get.ts
export default async ({ query }) => {
  const users = await db.users.findMany();
  return { users };
};
```

## Writing Middleware

Middleware is exported as default as an array or single function:

### Single Middleware

```typescript
// routes/_middleware.ts
export default (context) => {
  console.log(`${context.request.method} ${context.request.url}`);
};
```

### Multiple Middlewares

```typescript
// routes/_middleware.ts
export default [
  (context) => {
    console.log("Middleware 1");
  },
  (context) => {
    console.log("Middleware 2");
  },
];
```

### Middleware with Authentication

```typescript
// routes/admin/_middleware.ts
export default async ({ headers, error }) => {
  const token = headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return error(401, { message: "Unauthorized" });
  }

  const user = await verifyToken(token);
  if (!user) {
    return error(401, { message: "Invalid token" });
  }

  // Valid token, continue processing
};
```

## Method-Level Middleware

**NEW FEATURE** 🎉 You can now define middleware specific to individual route methods by exporting a `middleware` variable alongside the default handler:

### Single Method Middleware

```typescript
// routes/users/post.ts
import { OptionalHandler } from "elysia";

// Validation middleware for this route only
export const middleware: OptionalHandler = ({ body, error }) => {
  if (!body.email || !body.name) {
    return error(400, { message: "Email and name are required" });
  }
};

// Route handler
export default async ({ body }) => {
  const user = await db.users.create(body);
  return { message: "User created", user };
};
```

### Multiple Method Middlewares

```typescript
// routes/admin/users/delete.ts
import { OptionalHandler } from "elysia";

export const middleware: OptionalHandler[] = [
  // Check if user is super admin
  ({ store, error }) => {
    if (store.user.role !== "super_admin") {
      return error(403, { message: "Only super admins can delete users" });
    }
  },
  // Log deletion attempt
  ({ params, store }) => {
    console.log(`User ${store.user.id} attempting to delete user ${params.id}`);
  },
];

export default async ({ params }) => {
  await db.users.delete(params.id);
  return { message: "User deleted successfully" };
};
```

## Middleware Cascading

Middlewares are applied in order from parent to child, with method-level middlewares running last:

```
routes/
  ├── _middleware.ts          # [1] Runs first for all routes
  └── admin/
      ├── _middleware.ts      # [2] Runs second for /admin/*
      └── users/
          ├── _middleware.ts  # [3] Runs third for /admin/users/*
          └── post.ts         # [4] Method middleware (if exported)
                              # [5] Route handler
```

**Execution order**: `[1] → [2] → [3] → [4] Method Middleware → [5] Route Handler`

This allows you to:

- Share common logic via directory middlewares
- Add specific validation/logic per route method
- Keep route files self-contained with their specific requirements

## Complete Example

```typescript
// routes/_middleware.ts
export default [
  (context) => {
    console.log(
      `[${new Date().toISOString()}] ${context.request.method} ${context.path}`
    );
  },
];

// routes/api/_middleware.ts
export default async ({ headers, error }) => {
  const apiKey = headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return error(403, { message: "Invalid API key" });
  }
};

// routes/api/users/_middleware.ts
export default async ({ headers, error, store }) => {
  const token = headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return error(401, { message: "Unauthorized" });
  }

  const user = await verifyToken(token);
  if (!user) {
    return error(401, { message: "Invalid token" });
  }

  // Save user to store for use in route handler
  store.user = user;
};

// routes/api/users/get.ts
export default async ({ store }) => {
  const currentUser = store.user;
  const users = await db.users.findMany();

  return {
    currentUser: currentUser.email,
    users,
  };
};

// routes/api/users/[id]/get.ts
export default async ({ params, store, error }) => {
  const user = await db.users.findById(params.id);

  if (!user) {
    return error(404, { message: "User not found" });
  }

  return { user };
};

// routes/api/users/post.ts
import { OptionalHandler } from "elysia";

// Method-level middleware for validation
export const middleware: OptionalHandler[] = [
  ({ body, error }) => {
    // Validate required fields
    if (!body.email || !body.name) {
      return error(400, {
        message: "Email and name are required",
      });
    }
  },
  ({ body, error }) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return error(400, {
        message: "Invalid email format",
      });
    }
  },
];

export default async ({ body, store }) => {
  const newUser = await db.users.create({
    ...body,
    createdBy: store.user.id,
  });

  return {
    message: "User created successfully",
    user: newUser,
  };
};
```

## Performance

`elysia-nnn-router` is designed for high performance with minimal overhead:

### Runtime Performance ⚡

- **Throughput**: ~1,000,000 requests/second
- **Latency**: 0.001ms per request
- **Overhead**: 0% compared to native Elysia routing
- **Status**: Production-ready performance

### Startup Performance 🚀

| Routes | Startup Time | Memory Usage |
|--------|--------------|--------------|
| 50     | ~9ms         | ~4.6 MB      |
| 100    | ~16ms        | ~6.1 MB      |
| 200    | ~23ms        | ~15.8 MB     |

**Memory per endpoint**: ~0.03-0.04 MB

### Benchmarks

File-based routing has **zero runtime overhead** because:
- Routes are scanned and registered only once at startup
- After startup, routing uses Elysia's native high-performance router
- No additional lookups or file system operations during requests

**Key Insight**: Startup time only matters when starting the server. Once running, performance is identical to manually registered routes.

Run benchmarks yourself:
```bash
bun run benchmark.ts           # Runtime performance
bun --expose-gc benchmark-memory.ts  # Memory footprint
```

## System Requirements

- Bun v1.2.8 or higher
- Elysia ^1.3.4 or higher

## License

MIT

## Author

**The Anh**

- GitHub: [@theanh-it](https://github.com/theanh-it)
- Email: theanhit.com@gmail.com

## Contributing

All contributions are welcome! Please create an issue or pull request on GitHub.

## Links

- [GitHub Repository](https://github.com/theanh-it/elysia-nnn-router)
- [NPM Package](https://www.npmjs.com/package/elysia-nnn-router)
- [Report Issues](https://github.com/theanh-it/elysia-nnn-router/issues)
