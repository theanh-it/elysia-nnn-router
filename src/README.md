# Source Code Structure

Cấu trúc source code được tổ chức theo modules để dễ bảo trì và mở rộng.

## 📁 Directory Structure

```
src/
├── index.ts                    # Main entry point & plugin initialization
├── types.ts                    # TypeScript type definitions
│
├── utils/                      # Utility functions
│   └── route-path.ts          # Convert file paths to route paths
│
├── converters/                 # Schema converters
│   └── zod-to-typebox.ts      # Convert Zod schemas to TypeBox
│
├── handlers/                   # Request/middleware handlers
│   ├── validation.ts          # Zod validation middleware
│   └── middleware.ts          # Middleware management & cascading
│
└── scanner/                    # Route scanning & registration
    └── route-scanner.ts       # Scan directory and register routes
```

## 📝 Module Responsibilities

### `index.ts`

- **Plugin entry point**
- Khởi tạo Elysia app
- Cấu hình Swagger (nếu enabled)
- Export types cho consumers
- Gọi route scanner

### `types.ts`

- **Type definitions**
- `RouteSchema`: Schema cho request/response
- `RouteModule`: Structure của route file
- `SwaggerConfig`: Swagger configuration options
- `NnnRouterPluginOptions`: Plugin options
- `Method` types

### `utils/route-path.ts`

- **Route path utilities**
- Convert file paths → route paths
- Handle dynamic routes `[param]` → `:param`
- Clean và normalize paths

### `converters/zod-to-typebox.ts`

- **Schema conversion**
- Convert Zod schemas → TypeBox schemas
- Enable Swagger documentation từ Zod
- Support file uploads (`z.any()` → binary format)
- Handle tất cả Zod types phổ biến

### `handlers/validation.ts`

- **Request validation**
- Tạo validation middleware từ Zod schemas
- Validate body, query, params, headers
- Return detailed error messages
- Format errors theo chuẩn

### `handlers/middleware.ts`

- **Middleware management**
- `createGetMiddlewares`: Cache và cascade directory middlewares
- `createBeforeHandle`: Merge common + method middlewares
- Handle middleware inheritance từ parent → child directories

### `scanner/route-scanner.ts`

- **Route scanning & registration**
- Scan directory với Bun.Glob
- Group files by directory
- Process middlewares theo hierarchy
- Register routes với Elysia
- Convert schemas cho Swagger
- Handle file uploads

## 🔄 Data Flow

```
1. Plugin Initialize (index.ts)
   ↓
2. Scan Routes (scanner/route-scanner.ts)
   ↓
3. For Each Route:
   ├─ Load middlewares (handlers/middleware.ts)
   ├─ Create validation handler (handlers/validation.ts)
   ├─ Convert schemas (converters/zod-to-typebox.ts)
   └─ Register with Elysia
```

## 🎯 Adding New Features

### Add New Zod Type Support

Edit: `converters/zod-to-typebox.ts`

```typescript
case "ZodNewType":
  return Type.YourTypeBoxEquivalent();
```

### Add New Validation Logic

Edit: `handlers/validation.ts`

```typescript
// Add custom validation in createValidationHandler
if (schema.yourField) {
  // Your validation logic
}
```

### Modify Route Scanning

Edit: `scanner/route-scanner.ts`

```typescript
// Modify processDirectory function
// Add custom route processing logic
```

### Add New Utility

Create: `utils/your-utility.ts`

```typescript
export const yourUtility = () => {
  // Your utility logic
};
```

## 🧪 Testing

Mỗi module có thể test riêng:

```typescript
// Test converter
import { zodToTypeBox } from "./converters/zod-to-typebox";

// Test validation
import { createValidationHandler } from "./handlers/validation";

// Test middleware
import { createGetMiddlewares } from "./handlers/middleware";
```

## 📚 Dependencies Between Modules

```
index.ts
  └─> scanner/route-scanner.ts
      ├─> types.ts
      ├─> utils/route-path.ts
      ├─> handlers/validation.ts
      │   └─> types.ts
      ├─> handlers/middleware.ts
      └─> converters/zod-to-typebox.ts
```

## 🎨 Code Style

- **Single Responsibility**: Mỗi module làm 1 việc
- **Pure Functions**: Ưu tiên pure functions khi có thể
- **Type Safety**: Full TypeScript typing
- **Comments**: Document complex logic
- **Exports**: Named exports (không default exports)

## 🔧 Maintenance Tips

1. **Thay đổi validation logic**: Edit `handlers/validation.ts`
2. **Thêm Zod type mới**: Edit `converters/zod-to-typebox.ts`
3. **Sửa middleware cascading**: Edit `handlers/middleware.ts`
4. **Thêm route processing logic**: Edit `scanner/route-scanner.ts`
5. **Thêm utility functions**: Create trong `utils/`

## 📖 Documentation

Mỗi function đều có JSDoc comments explaining:

- Purpose
- Parameters
- Return values
- Examples (khi cần)
