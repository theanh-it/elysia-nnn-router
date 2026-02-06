# Demo Routes - elysia-nnn-router

Thư mục này chứa các ví dụ về cách sử dụng `elysia-nnn-router` với các trường hợp routes khác nhau.

## Cấu trúc Routes

### 1. Root Routes
- `get.ts` - GET `/`
- `post.ts` - POST `/`

### 2. Simple Routes
- `users/get.ts` - GET `/users`
- `users/post.ts` - POST `/users`

### 3. Dynamic Routes
- `users/[id]/get.ts` - GET `/users/:id`
- `users/[id]/put.ts` - PUT `/users/:id`
- `users/[id]/delete.ts` - DELETE `/users/:id`
- `products/[id]/get.ts` - GET `/products/:id`

### 4. Nested Routes
- `products/[id]/reviews/get.ts` - GET `/products/:id/reviews`
- `products/[id]/reviews/post.ts` - POST `/products/:id/reviews`
- `api/v1/posts/[postId]/comments/[commentId]/get.ts` - GET `/api/v1/posts/:postId/comments/:commentId`

### 5. Middleware Examples

#### Directory Middleware
- `_middleware.ts` - Root middleware (áp dụng cho tất cả routes)
- `users/_middleware.ts` - Middleware cho `/users/*` routes
- `users/[id]/_middleware.ts` - Middleware cho `/users/:id/*` routes

#### Method-Level Middleware
- `products/[id]/reviews/post.ts` - Single middleware
- `auth/login/post.ts` - Multiple middlewares (array)

### 6. Special Cases
- `search/get.ts` - Query parameters
- `status/get.ts` - Custom status code
- `error-example/get.ts` - Error handling
- `async-example/get.ts` - Async handler

## Cách sử dụng

```typescript
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "elysia-nnn-router";

const app = new Elysia().use(
  nnnRouterPlugin({
    dir: "demo-routes", // Đường dẫn đến thư mục routes
    prefix: "/api", // Optional: thêm prefix cho tất cả routes
  })
);

app.listen(3000);
```

## Ví dụ Requests

### Root Routes
```bash
GET  http://localhost:3000/
POST http://localhost:3000/
```

### User Routes
```bash
GET    http://localhost:3000/users
POST   http://localhost:3000/users
GET    http://localhost:3000/users/123
PUT    http://localhost:3000/users/123
DELETE http://localhost:3000/users/123
```

### Product Routes
```bash
GET  http://localhost:3000/products
GET  http://localhost:3000/products/456
GET  http://localhost:3000/products/456/reviews
POST http://localhost:3000/products/456/reviews
```

### Nested Routes
```bash
GET http://localhost:3000/api/v1/posts
GET http://localhost:3000/api/v1/posts/1
GET http://localhost:3000/api/v1/posts/1/comments/2
```

### Query Parameters
```bash
GET http://localhost:3000/search?q=test&page=1&limit=20
```

## Middleware Flow

Middleware được áp dụng theo thứ tự:
1. Root middleware (`_middleware.ts` ở root)
2. Directory middleware (theo thứ tự nested)
3. Method-level middleware (nếu có)

Ví dụ với route `/users/123`:
1. Root `_middleware.ts`
2. `users/_middleware.ts`
3. `users/[id]/_middleware.ts`
4. Method middleware (nếu có trong file route)

## Method-Level Middleware

Có thể định nghĩa middleware ở cấp method:

```typescript
// Single middleware
export default {
  middleware: (context) => {
    // Validation logic
  },
  default: (context) => {
    // Handler
  },
};

// Multiple middlewares
export default {
  middleware: [
    (context) => { /* middleware 1 */ },
    (context) => { /* middleware 2 */ },
  ],
  default: (context) => {
    // Handler
  },
};
```

## Error Handling

Middleware có thể return error để dừng request:

```typescript
export default {
  middleware: ({ body, error }) => {
    if (!body.email) {
      return error(400, { message: "Email is required" });
    }
  },
  default: ({ body }) => {
    return { success: true };
  },
};
```

