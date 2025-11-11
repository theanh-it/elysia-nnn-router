# 🔒 Type Safety Demo Guide

Complete interactive demo of type safety features in `elysia-nnn-router`.

---

## 🚀 Start Demo

```bash
cd elysia-nnn-router
bun run demo

# Server: http://localhost:3000
# Docs:   http://localhost:3000/docs
```

---

## 📊 Demo Routes Added

### Total: 5 new routes

1. `GET /api/type-safety` - Overview & documentation
2. `POST /api/type-safety/branded-ids` - Branded types demo
3. `POST /api/type-safety/type-inference` - Type inference demo
4. `POST /api/type-safety/complex-types` - Discriminated unions
5. `POST /api/type-safety/route-context/:accountId` - Typed context

---

## 🎮 Interactive Demos

### 1. Overview

**Endpoint:** `GET /api/type-safety`

**Try it:**
```bash
curl http://localhost:3000/api/type-safety
```

**Response:**
- Overview of all type safety features
- Examples for each feature
- How-to-use guide
- Links to other demos

**In Swagger:**
1. Go to http://localhost:3000/docs
2. Find "Type Safety" tag
3. Try "🔒 Type Safety Features"

---

### 2. Branded Types Demo

**Endpoint:** `POST /api/type-safety/branded-ids`

**What it demonstrates:**
- UserId and PostId are distinct types
- TypeScript prevents mixing IDs
- Compile-time safety, zero runtime cost

**Try it:**
```bash
curl -X POST http://localhost:3000/api/type-safety/branded-ids \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "postId": "post-456",
    "action": "like"
  }'
```

**Response shows:**
```json
{
  "success": true,
  "message": "Branded types ensure type safety!",
  "data": {
    "user": {
      "id": "user-123",
      "name": "User user-123",
      "type": "UserId (branded)"
    },
    "post": {
      "id": "post-456",
      "title": "Post post-456",
      "type": "PostId (branded)"
    }
  },
  "typeSafety": {
    "explanation": "userId and postId are now distinct types at compile-time",
    "benefit": "TypeScript prevents passing wrong ID to functions",
    "runtime": "No overhead - types are erased at runtime"
  }
}
```

**What happens at compile-time:**
```typescript
// ✅ Works
getUserName(userId);

// ❌ TypeScript error!
getUserName(postId); // Error: PostId is not UserId
```

---

### 3. Type Inference Demo

**Endpoint:** `POST /api/type-safety/type-inference`

**What it demonstrates:**
- Automatic type inference from Zod schemas
- Nested objects fully typed
- Optional fields handled correctly
- Arrays and records typed

**Try it:**
```bash
curl -X POST http://localhost:3000/api/type-safety/type-inference \
  -H "Content-Type: application/json" \
  -d '{
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "age": 30
    },
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": true
    },
    "tags": ["typescript", "elysia"],
    "social": {
      "github": "https://github.com/example"
    }
  }'
```

**Response shows:**
```json
{
  "success": true,
  "message": "TypeScript inferred all types from Zod schema!",
  "typeInference": {
    "explanation": "Types are automatically inferred from Zod schema",
    "benefits": [
      "No manual type definitions",
      "Full IDE autocomplete",
      "Compile-time type checking",
      "Refactoring safety"
    ]
  },
  "detectedTypes": {
    "firstName": "string (inferred from z.string())",
    "age": "number (inferred from z.number().int())",
    "theme": "'light' | 'dark' | 'auto' (inferred from z.enum())",
    "tags": "string[] (inferred from z.array(z.string()))"
  }
}
```

**What TypeScript knows:**
```typescript
// All automatically inferred!
ctx.body.personalInfo.firstName; // string
ctx.body.personalInfo.age;       // number
ctx.body.preferences.theme;      // "light" | "dark" | "auto"
ctx.body.tags;                   // string[]
ctx.body.social?.github;         // string | undefined
```

---

### 4. Complex Types Demo

**Endpoint:** `POST /api/type-safety/complex-types`

**What it demonstrates:**
- Discriminated unions
- Type narrowing based on discriminator
- Exhaustiveness checking
- Union type handling

**Try different actions:**

**Create:**
```bash
curl -X POST http://localhost:3000/api/type-safety/complex-types \
  -H "Content-Type: application/json" \
  -d '{
    "type": "create",
    "data": {
      "title": "New Post",
      "content": "Hello World",
      "tags": ["typescript"]
    }
  }'
```

**Update:**
```bash
curl -X POST http://localhost:3000/api/type-safety/complex-types \
  -H "Content-Type: application/json" \
  -d '{
    "type": "update",
    "id": "123",
    "data": {
      "title": "Updated Title"
    }
  }'
```

**Delete:**
```bash
curl -X POST http://localhost:3000/api/type-safety/complex-types \
  -H "Content-Type: application/json" \
  -d '{
    "type": "delete",
    "id": "123",
    "reason": "Spam content"
  }'
```

**Publish:**
```bash
curl -X POST http://localhost:3000/api/type-safety/complex-types \
  -H "Content-Type: application/json" \
  -d '{
    "type": "publish",
    "id": "123",
    "schedule": {
      "publishAt": "2025-12-01T10:00:00Z",
      "timezone": "UTC"
    }
  }'
```

**Response shows:**
```json
{
  "success": true,
  "message": "Action 'create' processed with type safety!",
  "typeSafety": {
    "discriminatedUnion": {
      "explanation": "Union type where TypeScript can narrow based on discriminator field",
      "discriminator": "type",
      "variants": ["create", "update", "delete", "publish"],
      "benefit": "Each case has different fields, TypeScript knows them all!"
    },
    "typeNarrowing": "Type narrowed to: { type: 'create', data: {...} }"
  }
}
```

**How type narrowing works:**
```typescript
const action = ctx.body;

switch (action.type) {
  case "create":
    action.data.title;  // ✅ TypeScript knows this exists
    break;
  case "update":
    action.id;          // ✅ TypeScript knows this exists
    break;
  case "delete":
    action.reason;      // ✅ TypeScript knows this is optional
    break;
  case "publish":
    action.schedule;    // ✅ TypeScript knows this is optional
    break;
}
```

---

### 5. Route Context Demo

**Endpoint:** `POST /api/type-safety/route-context/:accountId`

**What it demonstrates:**
- Fully typed RouteContext
- Body, query, params, headers all typed
- Type-safe response manipulation
- Helper functions with typed context

**Try it:**
```bash
curl -X POST "http://localhost:3000/api/type-safety/route-context/12345?sendEmail=yes&locale=vi" \
  -H "Content-Type: application/json" \
  -H "x-api-key: secret123" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com"
  }'
```

**Response shows:**
```json
{
  "success": true,
  "message": "All context properties are fully typed!",
  "greeting": "Xin chào, johndoe!",
  "extractedData": {
    "user": {
      "username": "johndoe",
      "email": "john@example.com",
      "accountId": "12345"
    },
    "preferences": {
      "sendEmail": true,
      "locale": "vi"
    },
    "request": {
      "apiKey": "***123",
      "userAgent": "curl/..."
    }
  },
  "typeSafety": {
    "body": {
      "types": {
        "username": "string (min: 3, max: 20)",
        "email": "string (email format)"
      },
      "autocomplete": "✅ IDE suggests: ctx.body.username, ctx.body.email"
    },
    "query": {
      "types": {
        "sendEmail": "'yes' | 'no' | undefined (optional)",
        "locale": "'en' | 'vi' | 'fr' (has default)"
      }
    },
    "params": {
      "types": {
        "accountId": "string (numeric pattern)"
      }
    }
  }
}
```

**What TypeScript knows:**
```typescript
// All fully typed from schema!
ctx.body.username;              // string
ctx.body.email;                 // string
ctx.query.sendEmail;            // "yes" | "no" | undefined
ctx.query.locale;               // "en" | "vi" | "fr"
ctx.params.accountId;           // string
ctx.headers["x-api-key"];       // string | undefined

// Response manipulation (also typed!)
ctx.set.headers["X-Custom"] = "value";  // ✅
```

---

## 📚 In Swagger UI

### Navigate to: http://localhost:3000/docs

### New "Type Safety" Tag

You'll see a new section with 5 endpoints:

1. **🔒 Type Safety Features** (GET)
   - Overview of all features
   - Quick start guide

2. **Branded Types Demo** (POST)
   - Interactive branded IDs example
   - See type safety in action

3. **Type Inference Demo** (POST)
   - Complex nested object
   - See automatic inference

4. **Complex Types Demo** (POST)
   - Try discriminated unions
   - See type narrowing

5. **Route Context Demo** (POST)
   - Fully typed context
   - All properties typed

### How to Test

1. Click on any endpoint
2. Click "Try it out"
3. Modify the example JSON
4. Click "Execute"
5. See typed response!

---

## 💡 Learning from Demo

### What You'll Learn

1. **Branded Types:**
   - How to create type-safe IDs
   - Prevent ID mixing at compile-time
   - Zero runtime cost

2. **Type Inference:**
   - Zod schema → TypeScript types
   - No manual definitions
   - Full autocomplete

3. **Complex Types:**
   - Discriminated unions
   - Type narrowing
   - Exhaustiveness checks

4. **Typed Context:**
   - RouteContext<typeof schema>
   - All properties typed
   - Safe refactoring

### Code Examples

Each demo endpoint returns:
- ✅ Working example
- ✅ Type safety explanation
- ✅ Benefits list
- ✅ Code snippets
- ✅ TypeScript behavior

---

## 🎯 Use Cases

### 1. API with Multiple Resource Types

**Use:** Branded types

```typescript
type UserId = Brand<string, "UserId">;
type ProductId = Brand<string, "ProductId">;
type OrderId = Brand<string, "OrderId">;

// Now TypeScript prevents mixing!
```

### 2. Complex Request Schemas

**Use:** Type inference

```typescript
const schema = {
  body: z.object({
    // Complex nested structure
  })
};

// TypeScript infers everything!
export default async (ctx: RouteContext<typeof schema>) => {
  // Full autocomplete here!
};
```

### 3. Multi-Action Endpoints

**Use:** Discriminated unions

```typescript
z.discriminatedUnion("action", [
  z.object({ action: "create", data: {...} }),
  z.object({ action: "update", id: string, data: {...} }),
]);

// TypeScript narrows type based on action!
```

### 4. Type-Safe Helpers

**Use:** Typed context

```typescript
function validateUser(ctx: RouteContext<typeof schema>) {
  // ctx.body.* is fully typed!
}
```

---

## 📊 Demo Statistics

```
New Routes:        5
New Tag:           "Type Safety"
Code Examples:     15+
Features Demo'd:   4
Response Formats:  Detailed explanations
Interactive:       ✅ Yes (via Swagger)
```

---

## 🎊 Summary

**Type Safety Demo: COMPLETE!** ✅

**Added:**
- ✅ 5 interactive demo routes
- ✅ Branded types example
- ✅ Type inference example
- ✅ Complex types example
- ✅ Typed context example
- ✅ Detailed explanations
- ✅ Code snippets
- ✅ Swagger integration

**Features Demonstrated:**
1. Branded types for type-safe IDs
2. Automatic type inference from Zod
3. Discriminated unions & narrowing
4. Fully typed RouteContext
5. Zero runtime overhead

**How to Use:**
1. Start demo: `bun run demo`
2. Open Swagger: http://localhost:3000/docs
3. Find "Type Safety" tag
4. Try each endpoint interactively!

---

**Last Updated:** 2025-11-11  
**Demo Version:** 0.2.0  
**Routes:** 24 total (5 new for type safety)  
**Status:** ✅ Production-Ready

