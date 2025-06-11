# elysia-nnn-router

Một plugin router cho Elysia framework, cho phép tự động quét và đăng ký các route từ cấu trúc thư mục.

## Cài đặt

```bash
bun add elysia-nnn-router
```

## Cách sử dụng

1. Tạo thư mục `routes` trong dự án của bạn
2. Tổ chức các route theo cấu trúc thư mục, ví dụ:

```
routes/
  ├── _middleware.ts
  ├── users/
  │   ├── _middleware.ts
  │   ├── get.ts
  │   ├── post.ts
  │   ├── put.ts
  │   ├── delete.ts
  │   ├── [id]/
  │   │   ├── _middleware.ts
  │   │   ├── get.ts
  │   │   ├── post.ts
  │   │   ├── put.ts
  │   │   └── delete.ts
  └── posts/
      ├── get.ts
      └── post.ts
```

3. Sử dụng plugin trong ứng dụng Elysia của bạn:

```typescript
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "elysia-nnn-router";

const app = new Elysia();

app.use(nnnRouterPlugin());

app.listen(3000, () => {
  console.log("Elysia server running at http://localhost:3000");
});
```

## Quy ước đặt tên

- Tên file route phải trùng với phương thức HTTP (`get.ts`, `post.ts`, `put.ts`, `delete.ts`, `patch.ts`, `options.ts`)
- File `_middleware.ts` trong mỗi thư mục sẽ được áp dụng cho tất cả các route trong thư mục đó
- Tham số động được đặt trong dấu ngoặc vuông, ví dụ: `[id]`

## Ví dụ

```typescript
// routes/users/[id]/get.ts
export default ({ params }) => {
  return `User ID: ${params.id}`;
};

// routes/_middleware.ts
import { Context } from "elysia";

export default [
  (context: Context) => {
    console.log("global middleware");
  },
];
```

## Yêu cầu

- Bun v1.2.8 trở lên
- Elysia framework
