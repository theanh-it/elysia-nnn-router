# 🚀 NNN Router Demo

Interactive demo application showcasing all features of `elysia-nnn-router`.

## 📦 Features Demonstrated

- ✅ **File-based routing** - Automatic route registration from directory structure
- ✅ **Zod schema validation** - Request/response validation with detailed errors
- ✅ **Swagger documentation** - Auto-generated interactive API docs
- ✅ **Directory-level middleware** - Cascading middleware through folder structure
- ✅ **Method-level middleware** - Per-route middleware for specific logic
- ✅ **Dynamic routes** - URL parameters with `[param]` syntax
- ✅ **Error handling** - Automatic validation error responses

## 🏃 Quick Start

```bash
# Install dependencies (if not already installed)
bun install

# Run the demo server
bun run demo

# Or directly
bun demo/app.ts
```

The server will start at: **http://localhost:3000**

## 📚 Access Swagger UI

Open your browser and navigate to:

**http://localhost:3000/docs**

Here you'll find:
- Interactive API documentation
- Try-it-out functionality
- Request/response examples
- Schema validation rules
- Authentication testing

## 🗂️ Demo Routes Structure

```
demo/routes/
├── _middleware.ts              # Global logging middleware
├── users/
│   ├── get.ts                  # GET /api/users (with query validation)
│   ├── post.ts                 # POST /api/users (with body validation)
│   └── [id]/
│       ├── get.ts              # GET /api/users/:id
│       ├── put.ts              # PUT /api/users/:id
│       └── delete.ts           # DELETE /api/users/:id
├── posts/
│   ├── get.ts                  # GET /api/posts (with filters)
│   └── post.ts                 # POST /api/posts
└── auth/
    ├── _middleware.ts          # Auth middleware (token validation)
    ├── login/
    │   └── post.ts            # POST /api/auth/login (public)
    └── profile/
        └── get.ts             # GET /api/auth/profile (protected)
```

## 🎯 Try These Examples

### 1. Create a User (Body Validation)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user",
    "age": 25
  }'
```

**Try invalid data to see validation errors:**

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "J",
    "email": "invalid-email",
    "password": "123"
  }'
```

### 2. Get Users (Query Validation)

```bash
# Get all users
curl http://localhost:3000/api/users

# With pagination
curl http://localhost:3000/api/users?page=1&limit=5

# Filter by role
curl http://localhost:3000/api/users?role=admin

# Search users
curl "http://localhost:3000/api/users?search=john"
```

### 3. Get User by ID (Params Validation)

```bash
# Valid user
curl http://localhost:3000/api/users/1

# Not found
curl http://localhost:3000/api/users/999

# Invalid ID (not a number)
curl http://localhost:3000/api/users/abc
```

### 4. Authentication Flow

**Step 1: Login to get token**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "demo-token",
    "user": {
      "id": 1,
      "email": "demo@example.com",
      "name": "Demo User"
    }
  }
}
```

**Step 2: Use token to access protected endpoint**

```bash
# Without token (401 error)
curl http://localhost:3000/api/auth/profile

# With valid token
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer demo-token"
```

### 5. Update User

```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "email": "john.new@example.com",
    "role": "admin"
  }'
```

### 6. Create a Post

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Blog Post",
    "content": "This is the content of my first blog post",
    "category": "tech",
    "published": true
  }'
```

### 7. Get Posts with Filters

```bash
# All posts
curl http://localhost:3000/api/posts

# Published posts only
curl http://localhost:3000/api/posts?published=true

# Filter by category
curl http://localhost:3000/api/posts?category=tech

# Multiple filters
curl "http://localhost:3000/api/posts?category=tech&published=true"
```

## 🎨 Testing in Swagger UI

1. **Open Swagger**: http://localhost:3000/docs
2. **Try without auth**: Click on `/api/auth/profile` → Try it out → Execute
   - You'll get 401 Unauthorized
3. **Login**: Click on `/api/auth/login` → Try it out
   - Use: `demo@example.com` / `password123`
   - Copy the token from response
4. **Authorize**: Click "Authorize" button at top
   - Enter: `Bearer demo-token`
   - Click Authorize
5. **Try again**: Now `/api/auth/profile` will work!

## 🧪 Validation Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe"
  }
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": "body.email",
      "message": "Invalid email format"
    },
    {
      "path": "body.name",
      "message": "Name must be at least 2 characters"
    }
  ]
}
```

## 🔍 Key Features Showcased

### 1. Schema Validation
Every route demonstrates Zod schema validation:
- **Body**: `POST /api/users` - validates email, name, password
- **Query**: `GET /api/users` - validates pagination, filters
- **Params**: `GET /api/users/:id` - validates ID format

### 2. Middleware Cascading
```
Global middleware (_middleware.ts)
  ↓
Auth directory middleware (auth/_middleware.ts)
  ↓
Method middleware (login/post.ts overrides auth)
  ↓
Route handler
```

### 3. Error Handling
- **Validation errors**: Automatic 422 responses with detailed errors
- **Not found**: 404 responses with custom messages
- **Auth errors**: 401 responses with hints

### 4. Swagger Documentation
- Auto-generated from Zod schemas
- Interactive testing
- Request/response examples
- Schema descriptions
- Tag organization

## 💡 Code Examples

### Basic Route with Schema

```typescript
// routes/users/post.ts
import { z } from "zod";

export const schema = {
  body: z.object({
    email: z.string().email(),
    name: z.string().min(2),
  }),
  response: {
    201: z.object({
      success: z.boolean(),
      data: z.object({
        id: z.number(),
        name: z.string(),
      }),
    }),
  },
  detail: {
    summary: "Create user",
    tags: ["Users"],
  },
};

export default async ({ body, set }) => {
  set.status = 201;
  return { success: true, data: body };
};
```

### Middleware

```typescript
// routes/auth/_middleware.ts
export default async ({ headers, error }) => {
  const token = headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return error(401, { message: "Token required" });
  }
};
```

### Method-Level Middleware

```typescript
// routes/users/post.ts
import { OptionalHandler } from "elysia";

export const middleware: OptionalHandler = ({ body, error }) => {
  if (!body.email) {
    return error(400, { message: "Email required" });
  }
};

export default async ({ body }) => {
  // Handler logic
};
```

## 📖 Learn More

- Check the source code in `demo/routes/` to see how each feature is implemented
- Modify the routes to experiment with different schemas
- Add your own routes to test additional features

## 🎉 Next Steps

1. ✅ Explore the Swagger UI
2. ✅ Try the curl examples above
3. ✅ Read the source code in `demo/routes/`
4. ✅ Create your own routes
5. ✅ Experiment with validation rules
6. ✅ Test middleware cascading

Enjoy exploring `elysia-nnn-router`! 🚀

