# 🛡️ Error Handling Guide

`elysia-nnn-router` cung cấp error handling system linh hoạt và mạnh mẽ.

---

## 📋 Table of Contents

1. [Default Error Handling](#default-error-handling)
2. [Custom Error Formatter](#custom-error-formatter)
3. [Custom Error Handler](#custom-error-handler)
4. [Debug Mode](#debug-mode)
5. [Route Load Error Handling](#route-load-error-handling)
6. [Strict Mode](#strict-mode)
7. [Examples](#examples)

---

## 🎯 Default Error Handling

Mặc định, router handle errors automatically:

### Validation Errors (422)

```typescript
// Request với data không hợp lệ
POST /api/users
{
  "email": "invalid",
  "age": 15
}

// Response tự động
{
  "status": "error",
  "message": "Validation error",
  "result": {
    "email": "Expected string to match 'email' format",
    "age": "Expected number greater or equal to 18"
  }
}
```

### Not Found (404)

```typescript
GET /api/nonexistent

// Response
{
  "status": "error",
  "message": "Not Found"
}
```

### Internal Errors (500)

```typescript
// Nếu route throw error
{
  "status": "error",
  "message": "Error message"
}
```

---

## 🎨 Custom Error Formatter

Thay đổi format của validation errors:

```typescript
await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    errorFormatter: (errors) => ({
      // Custom format
      success: false,
      errors: errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value,  // Giá trị bị lỗi
      })),
      timestamp: new Date().toISOString(),
    }),
  },
});
```

**Response:**
```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Expected string to match 'email' format",
      "value": "invalid-email"
    },
    {
      "field": "age",
      "message": "Expected number greater or equal to 18",
      "value": 15
    }
  ],
  "timestamp": "2025-11-10T10:00:00.000Z"
}
```

### Use Cases

**JSON:API Format:**
```typescript
errorFormatter: (errors) => ({
  errors: errors.map(e => ({
    status: "422",
    source: { pointer: `/data/attributes/${e.path}` },
    title: "Validation Error",
    detail: e.message,
  })),
})
```

**Simple Array Format:**
```typescript
errorFormatter: (errors) => ({
  errors: errors.map(e => `${e.path}: ${e.message}`),
})
```

---

## 🔧 Custom Error Handler

Handle tất cả errors (không chỉ validation):

```typescript
await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    onError: (context, set) => {
      // Log error
      console.error(`Error in ${context.method} ${context.path}:`, context.error);
      
      // Send to monitoring service
      sendToSentry(context.error);
      
      // Custom response
      if (context.code === "NOT_FOUND") {
        set.status = 404;
        return {
          error: "Resource not found",
          path: context.path,
          suggestion: "Check API documentation",
        };
      }
      
      // Default behavior
      set.status = 500;
      return {
        error: "Internal server error",
        requestId: generateRequestId(),
      };
    },
  },
});
```

### ErrorContext Properties

```typescript
{
  code: string | number,           // Error code (VALIDATION, NOT_FOUND, etc.)
  error: any,                      // Error object
  path: string,                    // Request path
  method: string,                  // HTTP method
  request: Request,                // Full request object
  validationErrors?: ValidationError[]  // Nếu là validation error
}
```

---

## 🐛 Debug Mode

Hiển thị chi tiết errors (development only):

```typescript
await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    debug: process.env.NODE_ENV !== "production",
  },
});
```

**Response khi có lỗi:**
```json
{
  "status": "error",
  "message": "Cannot read property 'name' of undefined",
  "code": "UNKNOWN",
  "stack": "Error: ...\n    at handler (/routes/users/get.ts:10:15)\n    at ...",
  "path": "/api/users",
  "method": "GET"
}
```

**⚠️ WARNING:** Không bật debug mode ở production (lộ stack trace)!

---

## 📂 Route Load Error Handling

Handle errors khi load route files:

```typescript
await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    onRouteLoadError: (error) => {
      console.error(`Failed to load route: ${error.method} ${error.path}`);
      console.error(`Phase: ${error.phase}`);  // import | validation | registration
      console.error(`Error: ${error.error.message}`);
      
      // Send alert
      sendAlert({
        type: "route_load_failure",
        route: `${error.method} ${error.path}`,
        error: error.error.message,
      });
    },
  },
});
```

### Route Load Error Phases

**1. Import Phase:**
```
Route file có syntax error hoặc import lỗi
Phase: "import"
```

**2. Validation Phase:**
```
Schema không hợp lệ
Phase: "validation"  
```

**3. Registration Phase:**
```
Không register được với Elysia
Phase: "registration"
```

---

## 🔒 Strict Mode

Throw error thay vì continue khi route load fail:

```typescript
await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    strict: true,  // App sẽ crash nếu có route lỗi
  },
});
```

**Default (strict: false):**
- Route lỗi bị skip
- App vẫn start
- Log warning

**Strict mode (strict: true):**
- Route lỗi → throw error
- App không start
- Force fix ngay

**Khuyến nghị:**
- Development: `strict: true` (catch errors sớm)
- Production: `strict: false` (availability > perfection)

---

## 📝 Examples

### Example 1: Production Setup

```typescript
import { nnnRouterPlugin } from "elysia-nnn-router";

const isProd = process.env.NODE_ENV === "production";

app.use(await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    // Custom formatter cho consistent API
    errorFormatter: (errors) => ({
      success: false,
      errors: errors.reduce((acc, e) => {
        acc[e.path] = e.message;
        return acc;
      }, {} as Record<string, string>),
    }),
    
    // Log errors to monitoring
    onError: (context, set) => {
      // Log mọi error
      logger.error({
        path: context.path,
        method: context.method,
        error: context.error.message,
        code: context.code,
      });
      
      // Send to Sentry/Datadog
      if (isProd) {
        sentryCapture(context.error, {
          tags: {
            path: context.path,
            method: context.method,
          },
        });
      }
    },
    
    // Debug mode chỉ ở development
    debug: !isProd,
    
    // Strict mode ở development
    strict: !isProd,
    
    // Track route load failures
    onRouteLoadError: (error) => {
      logger.error("Route load failed", {
        method: error.method,
        path: error.path,
        phase: error.phase,
        error: error.error.message,
      });
      
      if (isProd) {
        sendAlert({
          type: "route_load_failure",
          details: error,
        });
      }
    },
  },
}));
```

---

### Example 2: Different Formats for Different Errors

```typescript
await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    onError: (context, set) => {
      // Validation errors - custom format
      if (context.code === "VALIDATION" && context.validationErrors) {
        set.status = 422;
        return {
          type: "validation_error",
          fields: context.validationErrors.map(e => ({
            name: e.path,
            reason: e.message,
          })),
        };
      }
      
      // Not found - friendly message
      if (context.code === "NOT_FOUND") {
        set.status = 404;
        return {
          type: "not_found",
          message: `Endpoint ${context.path} not found`,
          available: "/docs",  // Link to docs
        };
      }
      
      // Internal errors - hide details in production
      set.status = 500;
      return {
        type: "server_error",
        message: process.env.NODE_ENV === "production"
          ? "An error occurred"
          : context.error.message,
      };
    },
  },
});
```

---

### Example 3: Comprehensive Error Logging

```typescript
await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    onError: (context, set) => {
      // Create error log
      const errorLog = {
        timestamp: new Date().toISOString(),
        path: context.path,
        method: context.method,
        code: context.code,
        error: context.error.message,
        stack: context.error.stack,
        request: {
          headers: Object.fromEntries(context.request.headers),
          url: context.request.url,
        },
      };
      
      // Log to file/service
      fs.appendFileSync("errors.log", JSON.stringify(errorLog) + "\n");
      
      // Return user-friendly response
      set.status = 500;
      return {
        error: "Something went wrong",
        requestId: crypto.randomUUID(),
        support: "contact@example.com",
      };
    },
    
    onRouteLoadError: (error) => {
      // Alert team khi route fail
      sendSlackMessage({
        channel: "#alerts",
        text: `🚨 Route Failed to Load!\n` +
              `Method: ${error.method}\n` +
              `Path: ${error.path}\n` +
              `Phase: ${error.phase}\n` +
              `Error: ${error.error.message}`,
      });
    },
  },
});
```

---

### Example 4: Multiple Error Handlers

```typescript
// Tạo reusable error handlers
const validationFormatter = (errors) => ({
  validation_errors: errors,
  docs: "https://api.example.com/docs",
});

const errorLogger = (context, set) => {
  // Log all errors
  console.error(`[${context.method}] ${context.path}:`, context.error);
  
  // Send metrics
  metrics.increment("api.errors", {
    path: context.path,
    code: context.code,
  });
};

// Use in plugin
app.use(await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    errorFormatter: validationFormatter,
    onError: errorLogger,
    debug: true,
  },
}));
```

---

## 🎯 Best Practices

### 1. Environment-Based Configuration

```typescript
const errorConfig = {
  development: {
    debug: true,
    strict: true,
    onError: (ctx, set) => {
      // Detailed errors for debugging
      return { ...ctx, stack: ctx.error.stack };
    },
  },
  production: {
    debug: false,
    strict: false,
    onError: (ctx, set) => {
      // Log but don't expose
      logger.error(ctx);
      return { error: "Internal error" };
    },
  },
};

app.use(await nnnRouterPlugin({
  dir: "routes",
  errorHandling: errorConfig[process.env.NODE_ENV || "development"],
}));
```

---

### 2. Centralized Error Tracking

```typescript
await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    onError: async (context, set) => {
      // Track all errors
      await errorTracker.track({
        error: context.error,
        path: context.path,
        method: context.method,
        timestamp: Date.now(),
      });
      
      // Return generic message
      set.status = 500;
      return { error: "Server error", id: generateErrorId() };
    },
  },
});
```

---

### 3. Graceful Degradation

```typescript
await nnnRouterPlugin({
  dir: "routes",
  errorHandling: {
    // Continue even if some routes fail
    strict: false,
    
    // Track failures
    onRouteLoadError: (error) => {
      failedRoutes.push(error);
    },
    
    // Expose health check
    onError: (context, set) => {
      if (context.path === "/health") {
        return {
          status: "degraded",
          failedRoutes: failedRoutes.length,
        };
      }
    },
  },
});
```

---

## ⚠️ Security Considerations

### ❌ DON'T: Expose stack traces in production

```typescript
// BAD - exposes internal structure
errorHandling: {
  debug: true,  // NEVER in production!
}
```

### ✅ DO: Use debug mode conditionally

```typescript
// GOOD - only in development
errorHandling: {
  debug: process.env.NODE_ENV !== "production",
}
```

### ❌ DON'T: Return error details to client

```typescript
// BAD
onError: (context, set) => ({
  error: context.error,  // May contain sensitive info
  stack: context.error.stack,
})
```

### ✅ DO: Log details, return generic message

```typescript
// GOOD
onError: (context, set) => {
  logger.error(context.error);  // Log server-side
  return { error: "An error occurred" };  // Generic to client
}
```

---

## 📊 Error Handling Options

### Complete Configuration

```typescript
interface ErrorHandlerConfig {
  // Custom validation error formatter
  errorFormatter?: (errors: ValidationError[]) => any;
  
  // Custom error handler (all errors)
  onError?: (context: ErrorContext, set: any) => any;
  
  // Route load error callback
  onRouteLoadError?: (error: RouteLoadError) => void;
  
  // Show detailed errors with stack traces
  debug?: boolean;  // Default: false
  
  // Throw on route load errors
  strict?: boolean;  // Default: false
}
```

### Types

```typescript
type ValidationError = {
  path: string;      // Field path (e.g. "email", "user.age")
  message: string;   // Error message
  value?: any;       // Invalid value
};

type RouteLoadError = {
  path: string;      // File path
  method: string;    // HTTP method
  error: Error;      // Error object
  phase: "import" | "validation" | "registration";
};

type ErrorContext = {
  code: string | number;           // Error code
  error: any;                      // Error object
  path: string;                    // Request path
  method: string;                  // HTTP method
  request: Request;                // Full request
  validationErrors?: ValidationError[];
};
```

---

## 🧪 Testing Error Handling

```typescript
// Test custom error formatter
const response = await app.handle(
  new Request("http://localhost/api/users", {
    method: "POST",
    body: JSON.stringify({ invalid: "data" }),
  })
);

const data = await response.json();
expect(data).toMatchObject({
  success: false,
  errors: expect.arrayContaining([...]),
});
```

---

## 💡 Common Patterns

### Pattern 1: Error Tracking

```typescript
const errorTracker = {
  errors: [],
  track(error) {
    this.errors.push(error);
  },
};

app.use(await nnnRouterPlugin({
  errorHandling: {
    onError: (ctx, set) => {
      errorTracker.track({
        path: ctx.path,
        error: ctx.error.message,
        time: Date.now(),
      });
    },
  },
}));

// Later: analyze errors
console.log("Error rate:", errorTracker.errors.length);
```

---

### Pattern 2: Conditional Error Details

```typescript
await nnnRouterPlugin({
  errorHandling: {
    onError: (context, set) => {
      const isDev = process.env.NODE_ENV !== "production";
      
      return {
        error: context.error.message,
        ...(isDev && {
          stack: context.error.stack,
          path: context.path,
          code: context.code,
        }),
      };
    },
  },
});
```

---

### Pattern 3: Error Response Standards

```typescript
// RFC 7807 Problem Details
await nnnRouterPlugin({
  errorHandling: {
    onError: (context, set) => {
      set.headers["Content-Type"] = "application/problem+json";
      
      return {
        type: `https://api.example.com/errors/${context.code}`,
        title: getErrorTitle(context.code),
        status: set.status,
        detail: context.error.message,
        instance: context.path,
      };
    },
  },
});
```

---

## 🎊 Summary

**Error Handling Features:**

✅ **Custom formatter** - Format validation errors  
✅ **Custom handler** - Handle all errors  
✅ **Debug mode** - Detailed error info  
✅ **Route load callbacks** - Track route failures  
✅ **Strict mode** - Fail fast in development  
✅ **Type-safe** - Full TypeScript support  

**Flexible & Powerful!** 🚀

---

**See also:**
- [VALIDATION.md](./VALIDATION.md) - Schema validation guide
- [README.md](./README.md) - General documentation

