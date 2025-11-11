# 🎯 Demo Features Overview

This document explains all features demonstrated in the demo application.

## 📁 Project Structure

```
demo/
├── app.ts                          # Main application file
├── README.md                       # Getting started guide
├── test-demo.sh                    # Automated test script
└── routes/
    ├── _middleware.ts              # Global logging middleware
    ├── users/                      # User management
    │   ├── get.ts                  # List users with filters
    │   ├── post.ts                 # Create user
    │   └── [id]/                   # Dynamic routes
    │       ├── get.ts              # Get user by ID
    │       ├── put.ts              # Update user
    │       └── delete.ts           # Delete user
    ├── posts/                      # Blog posts
    │   ├── get.ts                  # List posts with filters
    │   └── post.ts                 # Create post
    └── auth/                       # Authentication
        ├── _middleware.ts          # Auth middleware
        ├── login/
        │   └── post.ts             # Public login endpoint
        └── profile/
            └── get.ts              # Protected profile endpoint
```

## 🎨 Features Demonstrated

### 1. File-Based Routing ✅

Routes are automatically registered based on directory structure:

```
routes/users/get.ts        → GET  /api/users
routes/users/post.ts       → POST /api/users
routes/users/[id]/get.ts   → GET  /api/users/:id
```

**Key Points:**

- Zero configuration
- Intuitive structure
- Automatic HTTP method detection
- Dynamic routes with `[param]` syntax

### 2. Zod Schema Validation ✅

Every route demonstrates schema validation:

**Body Validation** (`POST /api/users`):

```typescript
body: z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin", "guest"]),
});
```

**Query Validation** (`GET /api/users`):

```typescript
query: z.object({
  page: z.string().regex(/^\d+$/).optional().default("1"),
  limit: z.string().regex(/^\d+$/).optional().default("10"),
  search: z.string().optional(),
  role: z.enum(["user", "admin", "guest"]).optional(),
});
```

**Params Validation** (`GET /api/users/:id`):

```typescript
params: z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});
```

**Benefits:**

- Automatic validation before handler
- Type-safe request data
- Detailed error messages
- Self-documenting code

### 3. Response Schemas ✅

Define expected responses for documentation:

```typescript
response: {
  200: z.object({
    success: z.boolean(),
    data: z.object({
      id: z.number(),
      name: z.string(),
    }),
  }),
  422: z.object({
    success: z.boolean(),
    message: z.string(),
    errors: z.array(z.object({
      path: z.string(),
      message: z.string(),
    })),
  }),
}
```

**Benefits:**

- Clear API contracts
- Auto-generated Swagger docs
- Better error handling
- Response validation (optional)

### 4. Swagger Documentation ✅

Auto-generated interactive API documentation:

```typescript
detail: {
  summary: "Create a new user",
  description: "Create a new user with validation. Password must be at least 8 characters.",
  tags: ["Users"],
}
```

**Features:**

- Interactive "Try it out"
- Request/response examples
- Schema descriptions
- Tag organization
- Dark mode support
- Authentication testing

### 5. Middleware Cascading ✅

Middleware flows from parent to child directories:

```
Global Middleware (_middleware.ts)
  ↓
  Logs all requests
  ↓
Auth Directory Middleware (auth/_middleware.ts)
  ↓
  Validates Bearer token
  ↓
Method Middleware (login/post.ts)
  ↓
  Can override parent middleware
  ↓
Route Handler
```

**Example:**

```typescript
// routes/_middleware.ts
export default (context) => {
  console.log(`${context.request.method} ${context.path}`);
};

// routes/auth/_middleware.ts
export default async ({ headers, error }) => {
  const token = headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return error(401, { message: "Token required" });
  }
};

// routes/auth/login/post.ts
// This endpoint overrides auth middleware
export const middleware = () => {
  console.log("Login endpoint - no auth required");
};
```

### 6. Method-Level Middleware ✅

Specific logic for individual routes:

```typescript
// routes/users/post.ts
import { OptionalHandler } from "elysia";

export const middleware: OptionalHandler = ({ body, error }) => {
  // Custom validation specific to this route
  if (body.email.includes("spam")) {
    return error(400, { message: "Spam email detected" });
  }
};

export default async ({ body }) => {
  // Handler logic
};
```

**Use Cases:**

- Route-specific validation
- Permission checks
- Rate limiting
- Custom logging

### 7. Dynamic Routes ✅

URL parameters with type validation:

```
routes/users/[id]/get.ts      → /api/users/:id
routes/posts/[slug]/get.ts    → /api/posts/:slug
routes/users/[id]/posts/get.ts → /api/users/:id/posts
```

**Validation:**

```typescript
params: z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});
```

### 8. Error Handling ✅

Automatic and custom error responses:

**Validation Errors (Automatic):**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": "body.email",
      "message": "Invalid email format"
    }
  ]
}
```

**Custom Errors:**

```typescript
if (!user) {
  return error(404, {
    success: false,
    message: "User not found",
  });
}
```

### 9. Authentication Flow ✅

Complete auth implementation:

**Step 1: Login (Public)**

```bash
POST /api/auth/login
{
  "email": "demo@example.com",
  "password": "password123"
}

Response: { "token": "demo-token" }
```

**Step 2: Protected Endpoint**

```bash
GET /api/auth/profile
Authorization: Bearer demo-token

Response: { "data": { "name": "John Doe" } }
```

**Step 3: Middleware Override**

- Login endpoint is public (overrides auth middleware)
- Profile endpoint requires token (uses auth middleware)

### 10. Query Filters ✅

Complex filtering with validation:

```typescript
// GET /api/users?role=admin&search=john&page=1&limit=10

query: z.object({
  role: z.enum(["user", "admin", "guest"]).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
```

## 🎯 Learning Path

### For Beginners:

1. ✅ Start with `routes/users/get.ts` - Simple GET endpoint
2. ✅ Look at `routes/users/post.ts` - Body validation
3. ✅ Check `routes/users/[id]/get.ts` - Dynamic routes
4. ✅ Explore `routes/_middleware.ts` - Global middleware

### For Advanced:

1. ✅ Study `routes/auth/_middleware.ts` - Auth implementation
2. ✅ Review `routes/auth/login/post.ts` - Middleware override
3. ✅ Examine error handling patterns
4. ✅ Understand middleware cascading

### For API Documentation:

1. ✅ Check `schema.detail` in any route
2. ✅ Open Swagger UI at `/docs`
3. ✅ Try interactive testing
4. ✅ See how schemas generate docs

## 📊 Comparison Table

| Feature          | Traditional         | With NNN Router          |
| ---------------- | ------------------- | ------------------------ |
| Route Definition | Manual registration | Auto from file structure |
| Validation       | Manual if/else      | Zod schemas              |
| Documentation    | Manual Swagger spec | Auto-generated           |
| Middleware       | Complex setup       | Directory-based          |
| Type Safety      | Manual types        | Inferred from Zod        |
| Error Handling   | Manual catch        | Auto validation errors   |

## 🔥 Best Practices Demonstrated

1. **Schema Co-location**: Schemas defined next to handlers
2. **Type Inference**: Using `z.infer<typeof schema>`
3. **Error Messages**: Clear, user-friendly validation messages
4. **Response Structure**: Consistent `{ success, message, data }` format
5. **Middleware Organization**: From general to specific
6. **Documentation**: Detailed summaries and descriptions
7. **Mock Data**: Realistic examples for testing

## 🎉 Try It Yourself

1. **Start the server**: `bun run demo`
2. **Open Swagger**: http://localhost:3000/docs
3. **Try endpoints**: Use "Try it out" feature
4. **Test validation**: Submit invalid data
5. **Test auth**: Login → Get token → Access profile
6. **Explore code**: Read route files to understand

## 📚 Next Steps

- Add your own routes in `demo/routes/`
- Experiment with different validation rules
- Create custom middleware
- Try different response schemas
- Test error scenarios

Happy coding! 🚀
