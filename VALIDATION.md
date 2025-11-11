# Schema Validation Guide

`elysia-nnn-router` hỗ trợ **2 cách định nghĩa schema validation**:

1. ✅ **Zod** - Schema validation phổ biến, type-safe
2. ✅ **TypeBox** - Schema built-in của Elysia, native validation

---

## 📦 Cách 1: Sử dụng Zod (Khuyến nghị cho TypeScript)

### Ưu điểm:
- Type inference tự động
- Syntax dễ đọc, dễ viết
- Ecosystem lớn với nhiều utilities
- Custom validation dễ dàng với `.refine()`, `.transform()`

### Cài đặt:
```bash
bun add zod
```

### Ví dụ:

```typescript
import { z } from "zod";

export const schema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(20),
    age: z.number().int().min(18).optional(),
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      data: z.any(),
    }),
  },
  detail: {
    summary: "Login user",
    tags: ["Auth"],
  },
};

export default async ({ body }: any) => {
  // body đã được validate tự động
  return { success: true, data: body };
};
```

### Các validation phổ biến:

```typescript
// String
z.string()
  .min(3)                  // Tối thiểu 3 ký tự
  .max(50)                 // Tối đa 50 ký tự
  .email()                 // Format email
  .url()                   // Format URL
  .uuid()                  // Format UUID
  .regex(/^\d+$/)          // Pattern matching
  .datetime()              // ISO datetime
  .length(10)              // Đúng 10 ký tự

// Number
z.number()
  .min(0)                  // Tối thiểu 0
  .max(100)                // Tối đa 100
  .int()                   // Số nguyên
  .positive()              // Số dương
  .multipleOf(5)           // Bội số của 5

// Array
z.array(z.string())
  .min(1)                  // Ít nhất 1 item
  .max(10)                 // Tối đa 10 items
  .length(5)               // Đúng 5 items
  .nonempty()              // Không rỗng

// Object
z.object({
  name: z.string(),
  age: z.number().optional(),  // Optional field
  email: z.string().email().default("test@example.com"),  // Default value
})

// Enum
z.enum(["user", "admin", "guest"])

// Union
z.union([z.string(), z.number()])

// Complex types
z.tuple([z.string(), z.number()])         // Tuple
z.record(z.string(), z.number())          // Record/Dictionary
z.date()                                  // Date
z.literal("exact value")                  // Literal value
```

---

## 🔧 Cách 2: Sử dụng TypeBox (Native Elysia)

### Ưu điểm:
- **Native** trong Elysia, không cần dependency thêm
- Performance tốt hơn (validation compile-time)
- Schema tương thích trực tiếp với Swagger/OpenAPI
- Không cần convert schema

### Cài đặt:
```bash
bun add @sinclair/typebox
```

### Ví dụ:

```typescript
import { Type } from "@sinclair/typebox";

export const schema = {
  body: Type.Object({
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 6, maxLength: 20 }),
    age: Type.Optional(Type.Integer({ minimum: 18 })),
  }),
  response: {
    200: Type.Object({
      success: Type.Boolean(),
      data: Type.Any(),
    }),
  },
  detail: {
    summary: "Login user",
    tags: ["Auth"],
  },
};

export default async ({ body }: any) => {
  // body đã được validate tự động bởi Elysia
  return { success: true, data: body };
};
```

### Các validation phổ biến:

```typescript
// String
Type.String({
  minLength: 3,            // Tối thiểu 3 ký tự
  maxLength: 50,           // Tối đa 50 ký tự
  format: "email",         // email, uri, uuid, date-time
  pattern: "^\\d+$",       // Regex pattern
})

// Number & Integer
Type.Number({
  minimum: 0,              // Tối thiểu 0
  maximum: 100,            // Tối đa 100
  multipleOf: 5,           // Bội số của 5
})

Type.Integer({             // Số nguyên
  minimum: 18,
  maximum: 120,
})

// Array
Type.Array(Type.String(), {
  minItems: 1,             // Ít nhất 1 item
  maxItems: 10,            // Tối đa 10 items
})

// Object
Type.Object({
  name: Type.String(),
  age: Type.Optional(Type.Integer()),  // Optional field
})

// Union (Enum-like)
Type.Union([
  Type.Literal("user"),
  Type.Literal("admin"),
  Type.Literal("guest"),
])

// Complex types
Type.Tuple([Type.String(), Type.Number()])  // Tuple
Type.Record(Type.String(), Type.Number())   // Record
Type.Literal("exact value")                 // Literal
Type.Null()                                 // Null
Type.Any()                                  // Any
```

---

## 🆚 So sánh Zod vs TypeBox

| Tính năng | Zod | TypeBox |
|-----------|-----|---------|
| **Syntax** | Functional, fluent API | Object-based config |
| **Type inference** | ✅ Tự động | ⚠️ Cần setup thêm |
| **Custom validation** | ✅ `.refine()`, `.transform()` | ⚠️ Hạn chế hơn |
| **Performance** | ⚠️ Runtime validation | ✅ Compile-time optimization |
| **Bundle size** | ⚠️ ~13KB | ✅ ~5KB |
| **Elysia native** | ❌ Cần convert | ✅ Native support |
| **Ecosystem** | ✅ Lớn, nhiều tools | ⚠️ Nhỏ hơn |

---

## 🎯 Khuyến nghị sử dụng:

### Dùng Zod khi:
- ✅ Cần type inference mạnh mẽ
- ✅ Validation phức tạp với custom logic
- ✅ Đã quen với Zod ecosystem
- ✅ Ưu tiên developer experience

### Dùng TypeBox khi:
- ✅ Cần performance tối ưu
- ✅ Muốn giảm dependencies
- ✅ Schema đơn giản, standard validation
- ✅ Ưu tiên native Elysia

---

## 🔄 Mix & Match

Bạn có thể **mix cả hai** trong cùng một project!

```typescript
// routes/auth/login/post.ts - Dùng Zod
import { z } from "zod";
export const schema = {
  body: z.object({ /* ... */ }),
};

// routes/users/get.ts - Dùng TypeBox
import { Type } from "@sinclair/typebox";
export const schema = {
  query: Type.Object({ /* ... */ }),
};
```

Plugin tự động detect và xử lý đúng loại schema! 🎉

---

## 📝 Notes

1. **Validation errors** được format tự động theo chuẩn:
```json
{
  "status": "error",
  "message": "Validation error",
  "result": {
    "fieldName": "Error message"
  }
}
```

2. **Response schemas** (200, 400, etc.) chỉ dùng cho **Swagger docs**, không validate response thực tế.

3. Plugin tự động **convert Zod → TypeBox** để hiển thị Swagger docs, validation vẫn do Zod xử lý.

