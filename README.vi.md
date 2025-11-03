# elysia-nnn-router

[![npm version](https://img.shields.io/npm/v/elysia-nnn-router.svg)](https://www.npmjs.com/package/elysia-nnn-router)
[![npm downloads](https://img.shields.io/npm/dm/elysia-nnn-router.svg)](https://www.npmjs.com/package/elysia-nnn-router)
[![license](https://img.shields.io/npm/l/elysia-nnn-router.svg)](https://github.com/theanh-it/elysia-nnn-router/blob/main/LICENSE)

[English](./README.md) | **Tiếng Việt**

> **Phiên bản hiện tại:** 0.0.9

Một plugin router cho Elysia framework, cho phép tự động quét và đăng ký các route từ cấu trúc thư mục với hỗ trợ middleware theo cấp độ thư mục.

## Đặc điểm nổi bật

- 🚀 Tự động quét và đăng ký routes từ cấu trúc thư mục
- 🔄 Hỗ trợ tất cả HTTP methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- 🎯 Dynamic routes với cú pháp `[param]`
- 🛡️ Middleware cascading theo cấu trúc thư mục
- 🎪 Method-level middleware cho logic riêng từng route
- ⚡ Hiệu suất cao với Bun
- 📦 TypeScript support

## Cài đặt

```bash
bun add elysia-nnn-router
```

## Cách sử dụng cơ bản

1. Tạo thư mục `routes` trong dự án của bạn
2. Tổ chức các route theo cấu trúc thư mục:

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

3. Sử dụng plugin trong ứng dụng:

```typescript
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "elysia-nnn-router";

const app = new Elysia();

app.use(nnnRouterPlugin());

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
```

## Tùy chọn cấu hình

```typescript
app.use(
  nnnRouterPlugin({
    dir: "custom-routes", // Thư mục chứa routes (mặc định: "routes")
    prefix: "/api", // Prefix cho tất cả routes (mặc định: "")
  })
);
```

### Ví dụ với prefix

```typescript
// Với prefix: "/api"
// routes/users/get.ts -> GET /api/users
// routes/users/[id]/get.ts -> GET /api/users/:id
```

## Quy ước đặt tên

### Route Files

Tên file route phải khớp với HTTP method (không phân biệt hoa thường):

- `get.ts` hoặc `get.js` → GET request
- `post.ts` hoặc `post.js` → POST request
- `put.ts` hoặc `put.js` → PUT request
- `delete.ts` hoặc `delete.js` → DELETE request
- `patch.ts` hoặc `patch.js` → PATCH request
- `options.ts` hoặc `options.js` → OPTIONS request

### Dynamic Routes

Sử dụng `[tên_tham_số]` cho dynamic routes:

```
routes/users/[id]/get.ts        → GET /users/:id
routes/posts/[slug]/get.ts      → GET /posts/:slug
routes/users/[id]/posts/get.ts  → GET /users/:id/posts
```

### Middleware

File `_middleware.ts` trong thư mục sẽ áp dụng cho:

- Tất cả routes trong thư mục đó
- Tất cả routes trong các thư mục con

## Cách viết Route Handler

Route handler là một function được export default:

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

### Với async handler

```typescript
// routes/users/get.ts
export default async ({ query }) => {
  const users = await db.users.findMany();
  return { users };
};
```

## Cách viết Middleware

Middleware được export default dưới dạng array hoặc single function:

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

### Middleware với Authentication

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

  // Token hợp lệ, tiếp tục xử lý
};
```

## Method-Level Middleware (Middleware cấp Method)

**TÍNH NĂNG MỚI** 🎉 Bạn có thể định nghĩa middleware riêng cho từng route method bằng cách export biến `middleware` cùng với handler:

### Single Method Middleware

```typescript
// routes/users/post.ts
import { OptionalHandler } from "elysia";

// Middleware validation chỉ cho route này
export const middleware: OptionalHandler = ({ body, error }) => {
  if (!body.email || !body.name) {
    return error(400, { message: "Email và name là bắt buộc" });
  }
};

// Route handler
export default async ({ body }) => {
  const user = await db.users.create(body);
  return { message: "Tạo user thành công", user };
};
```

### Multiple Method Middlewares

```typescript
// routes/admin/users/delete.ts
import { OptionalHandler } from "elysia";

export const middleware: OptionalHandler[] = [
  // Kiểm tra user có phải super admin không
  ({ store, error }) => {
    if (store.user.role !== "super_admin") {
      return error(403, { message: "Chỉ super admin mới có thể xóa user" });
    }
  },
  // Log thao tác xóa
  ({ params, store }) => {
    console.log(`User ${store.user.id} đang cố xóa user ${params.id}`);
  },
];

export default async ({ params }) => {
  await db.users.delete(params.id);
  return { message: "Xóa user thành công" };
};
```

## Middleware Cascading

Middleware được áp dụng theo thứ tự từ parent đến child, middleware cấp method chạy cuối cùng:

```
routes/
  ├── _middleware.ts          # [1] Chạy đầu tiên cho tất cả routes
  └── admin/
      ├── _middleware.ts      # [2] Chạy sau cho /admin/*
      └── users/
          ├── _middleware.ts  # [3] Chạy thứ ba cho /admin/users/*
          └── post.ts         # [4] Method middleware (nếu có export)
                              # [5] Route handler
```

**Thứ tự thực thi**: `[1] → [2] → [3] → [4] Method Middleware → [5] Route Handler`

Điều này cho phép bạn:

- Chia sẻ logic chung qua directory middlewares
- Thêm validation/logic riêng cho từng route method
- Giữ route files tự đủ với các requirements riêng của chúng

## Ví dụ hoàn chỉnh

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

  // Lưu user vào store để sử dụng trong route handler
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

// Method-level middleware cho validation
export const middleware: OptionalHandler[] = [
  ({ body, error }) => {
    // Validate các field bắt buộc
    if (!body.email || !body.name) {
      return error(400, {
        message: "Email và name là bắt buộc",
      });
    }
  },
  ({ body, error }) => {
    // Validate định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return error(400, {
        message: "Định dạng email không hợp lệ",
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
    message: "Tạo user thành công",
    user: newUser,
  };
};
```

## Yêu cầu hệ thống

- Bun v1.2.8 trở lên
- Elysia ^1.3.4 trở lên

## License

MIT

## Tác giả

**The Anh**

- GitHub: [@theanh-it](https://github.com/theanh-it)
- Email: theanhit.com@gmail.com

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request trên GitHub.

## Links

- [GitHub Repository](https://github.com/theanh-it/elysia-nnn-router)
- [NPM Package](https://www.npmjs.com/package/elysia-nnn-router)
- [Report Issues](https://github.com/theanh-it/elysia-nnn-router/issues)
