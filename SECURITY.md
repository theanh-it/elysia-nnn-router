# 🛡️ Security Features Guide

`elysia-nnn-router` cung cấp các security features built-in để protect your API.

---

## 📋 Table of Contents

1. [Rate Limiting](#rate-limiting)
2. [CORS](#cors)
3. [Security Headers](#security-headers)
4. [CSRF Protection](#csrf-protection)
5. [Input Sanitization](#input-sanitization)
6. [Best Practices](#best-practices)

---

## 🚦 Rate Limiting

Giới hạn số requests từ một client trong một khoảng thời gian.

### Basic Usage

```typescript
await nnnRouterPlugin({
  dir: "routes",
  security: {
    rateLimit: {
      enabled: true,
      max: 100,       // 100 requests
      window: "1m",   // per minute
    },
  },
});
```

### Advanced Configuration

```typescript
await nnnRouterPlugin({
  security: {
    rateLimit: {
      enabled: true,
      max: 1000,
      window: "1h",  // 1000 requests per hour
      message: "Rate limit exceeded. Please try again later.",
      skipSuccessful: false,  // Count all requests
      
      // Custom key generator (by IP, user ID, etc.)
      keyGenerator: (request) => {
        // Use user ID if authenticated
        const userId = request.headers.get("x-user-id");
        if (userId) return `user:${userId}`;
        
        // Fallback to IP
        return request.headers.get("x-forwarded-for") || "unknown";
      },
    },
  },
});
```

### Window Formats

```
"1s"  - 1 second
"30s" - 30 seconds
"1m"  - 1 minute  
"5m"  - 5 minutes
"1h"  - 1 hour
"24h" - 24 hours
"1d"  - 1 day
```

### Response Headers

Khi rate limiting enabled, response sẽ có headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
Retry-After: 60  (khi bị block)
```

### Error Response (429)

```json
{
  "status": "error",
  "message": "Too many requests"
}
```

---

## 🌐 CORS

Cross-Origin Resource Sharing configuration.

### Basic Usage

```typescript
await nnnRouterPlugin({
  security: {
    cors: {
      enabled: true,
      origin: "https://example.com",
    },
  },
});
```

### Multiple Origins

```typescript
await nnnRouterPlugin({
  security: {
    cors: {
      enabled: true,
      origin: [
        "https://example.com",
        "https://app.example.com",
        "http://localhost:3000",
      ],
    },
  },
});
```

### Dynamic Origin Check

```typescript
await nnnRouterPlugin({
  security: {
    cors: {
      enabled: true,
      origin: (origin) => {
        // Allow all subdomains of example.com
        return origin.endsWith(".example.com");
      },
    },
  },
});
```

### Full Configuration

```typescript
await nnnRouterPlugin({
  security: {
    cors: {
      enabled: true,
      origin: "*",  // Allow all (not recommended for production)
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,  // Allow cookies
      maxAge: 86400,  // Cache preflight for 24h
      allowedHeaders: ["Content-Type", "Authorization", "X-Custom-Header"],
      exposedHeaders: ["X-Total-Count", "X-Page-Number"],
    },
  },
});
```

---

## 🔒 Security Headers

Helmet-like security headers để protect against common attacks.

### Basic Usage

```typescript
await nnnRouterPlugin({
  security: {
    headers: {
      enabled: true,
    },
  },
});
```

**Default headers:**
- `Content-Security-Policy`
- `X-XSS-Protection`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Strict-Transport-Security`
- `Referrer-Policy`
- `Permissions-Policy`

### Custom Configuration

```typescript
await nnnRouterPlugin({
  security: {
    headers: {
      enabled: true,
      
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "'unsafe-inline'", "https://cdn.example.com"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "https:"],
          "font-src": ["'self'", "https:"],
          "connect-src": ["'self'", "https://api.example.com"],
        },
      },
      
      // XSS Protection
      xssProtection: true,
      
      // MIME Type Sniffing Protection
      noSniff: true,
      
      // Clickjacking Protection
      frameGuard: "deny",  // or "sameorigin"
      
      // HSTS
      hsts: {
        maxAge: 31536000,  // 1 year
        includeSubDomains: true,
      },
    },
  },
});
```

### Headers Explained

**Content-Security-Policy:**
```
Prevents XSS attacks by controlling resource loading
```

**X-XSS-Protection:**
```
Enables browser's XSS filter
```

**X-Content-Type-Options:**
```
Prevents MIME-type sniffing
```

**X-Frame-Options:**
```
Prevents clickjacking attacks
deny = không cho embed trong iframe
sameorigin = chỉ cho same origin
```

**Strict-Transport-Security:**
```
Forces HTTPS connections
```

---

## 🛡️ CSRF Protection

Protect against Cross-Site Request Forgery attacks.

### Enable CSRF

```typescript
await nnnRouterPlugin({
  security: {
    csrf: true,
  },
});
```

### How It Works

**1. GET request lần đầu:**
- Server set CSRF cookie
- Cookie: `csrf-token=abc123`

**2. State-changing requests (POST, PUT, DELETE):**
- Client phải gửi token trong header
- Header: `X-CSRF-Token: abc123`
- Server verify token matches cookie

**3. Nếu không match:**
- Response 403 Forbidden
- Block request

### Client Implementation

```typescript
// 1. Get CSRF token (usually on page load)
const response = await fetch("/api/auth/csrf");
const data = await response.json();
const csrfToken = data.token;

// 2. Include token in subsequent requests
await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,  // ← Required!
  },
  body: JSON.stringify({ name: "John" }),
});
```

### Token Endpoint Example

```typescript
// routes/auth/csrf/get.ts
import { setCsrfCookie } from "elysia-nnn-router/security/csrf";

export default async ({ set }) => {
  const token = setCsrfCookie(set);
  return { token };
};
```

---

## 🧹 Input Sanitization

Tự động sanitize input để prevent XSS attacks.

### Enable Sanitization

```typescript
await nnnRouterPlugin({
  security: {
    sanitizeInput: true,
  },
});
```

### What Gets Sanitized

**Removes:**
- HTML tags: `<script>`, `<iframe>`, etc.
- Event handlers: `onclick=`, `onload=`, etc.
- JavaScript protocol: `javascript:alert()`
- Dangerous characters: `<`, `>`

**Example:**

**Input:**
```json
{
  "name": "<script>alert('xss')</script>John",
  "bio": "Hello <b>world</b>",
  "url": "javascript:alert('xss')"
}
```

**After Sanitization:**
```json
{
  "name": "John",
  "bio": "Hello world",
  "url": "alert('xss')"
}
```

### Safe Values

Sanitization không ảnh hưởng:
- ✅ Normal text
- ✅ Numbers
- ✅ Booleans
- ✅ Valid URLs
- ✅ Emails

---

## 🎯 Complete Security Setup

### Production-Ready Configuration

```typescript
import { nnnRouterPlugin } from "elysia-nnn-router";

const isProd = process.env.NODE_ENV === "production";

app.use(await nnnRouterPlugin({
  dir: "routes",
  prefix: "api",
  
  security: {
    // Rate limiting
    rateLimit: {
      enabled: true,
      max: isProd ? 1000 : 10000,  // Stricter in prod
      window: "1h",
      message: "Too many requests. Please try again later.",
    },
    
    // CORS
    cors: {
      enabled: true,
      origin: isProd 
        ? ["https://example.com", "https://app.example.com"]
        : "*",  // Allow all in development
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
    
    // Security headers
    headers: {
      enabled: true,
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "https://cdn.example.com"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
      frameGuard: "deny",
    },
    
    // CSRF protection
    csrf: isProd,  // Enable in production
    
    // Input sanitization
    sanitizeInput: true,  // Always sanitize
  },
}));
```

---

## 🧪 Testing Security

### Test CORS

```typescript
const response = await fetch("http://localhost:3000/api/users", {
  headers: {
    "Origin": "https://example.com",
  },
});

console.log(response.headers.get("Access-Control-Allow-Origin"));
// "https://example.com"
```

### Test Rate Limiting

```bash
# Make multiple requests
for i in {1..101}; do
  curl http://localhost:3000/api/users
done

# 101st request should return 429
```

### Test Security Headers

```bash
curl -I http://localhost:3000/api/users

# Should see:
# X-XSS-Protection: 1; mode=block
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# ...
```

---

## ⚠️ Security Checklist

### Essential (Production)

- [ ] ✅ Enable rate limiting
- [ ] ✅ Configure CORS properly (không dùng `*` origin)
- [ ] ✅ Enable security headers
- [ ] ✅ Enable input sanitization
- [ ] ✅ Use HTTPS (HSTS headers)

### Recommended

- [ ] ✅ Enable CSRF for state-changing operations
- [ ] ✅ Configure CSP restrictively
- [ ] ✅ Set up monitoring/alerts
- [ ] ✅ Regular security audits
- [ ] ✅ Keep dependencies updated

### Advanced

- [ ] 🔄 Use Redis for distributed rate limiting
- [ ] 🔄 Implement API key authentication
- [ ] 🔄 Add request signing
- [ ] 🔄 Set up WAF (Web Application Firewall)
- [ ] 🔄 Implement rate limiting per endpoint

---

## 💡 Best Practices

### 1. Environment-Based Security

```typescript
const securityConfig = {
  development: {
    rateLimit: { enabled: false },  // Unlimited in dev
    cors: { origin: "*" },          // Allow all
    headers: { enabled: false },    // No headers
    csrf: false,                    // Disabled
  },
  production: {
    rateLimit: { enabled: true, max: 1000, window: "1h" },
    cors: { origin: ["https://example.com"] },  // Strict
    headers: { enabled: true },
    csrf: true,
    sanitizeInput: true,
  },
};

app.use(await nnnRouterPlugin({
  security: securityConfig[process.env.NODE_ENV || "development"],
}));
```

---

### 2. Defense in Depth

Combine multiple security layers:

```typescript
await nnnRouterPlugin({
  security: {
    rateLimit: { enabled: true },     // Layer 1: Rate limit
    cors: { enabled: true },          // Layer 2: CORS
    headers: { enabled: true },       // Layer 3: Security headers
    sanitizeInput: true,              // Layer 4: Input sanitization
    csrf: true,                       // Layer 5: CSRF protection
  },
});
```

---

### 3. Monitor Security Events

```typescript
await nnnRouterPlugin({
  security: {
    rateLimit: {
      enabled: true,
      keyGenerator: (request) => {
        const key = request.headers.get("x-forwarded-for") || "unknown";
        
        // Log rate limit attempts
        metrics.increment("rate_limit.check", { ip: key });
        
        return key;
      },
    },
  },
  
  errorHandling: {
    onError: (context, set) => {
      // Log security-related errors
      if (context.code === 429 || context.code === 403) {
        logger.warn("Security event", {
          code: context.code,
          path: context.path,
          ip: context.request.headers.get("x-forwarded-for"),
        });
      }
    },
  },
});
```

---

## 🔐 Security Headers Details

### CSP (Content Security Policy)

**Strict CSP:**
```typescript
contentSecurityPolicy: {
  directives: {
    "default-src": ["'none'"],  // Block all by default
    "script-src": ["'self'"],   // Only own scripts
    "style-src": ["'self'"],    // Only own styles
    "img-src": ["'self'", "data:"],
    "connect-src": ["'self'"],
    "font-src": ["'self'"],
    "frame-src": ["'none'"],   // No iframes
  },
}
```

**Relaxed CSP (for compatibility):**
```typescript
contentSecurityPolicy: {
  directives: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
  },
}
```

---

### HSTS (HTTP Strict Transport Security)

Force HTTPS connections:

```typescript
hsts: {
  maxAge: 31536000,        // 1 year
  includeSubDomains: true, // Apply to subdomains
}
```

**Recommended:**
- Development: Disabled
- Staging: 1 week (604800)
- Production: 1 year (31536000)

---

## 🎯 Common Scenarios

### Scenario 1: Public API

```typescript
await nnnRouterPlugin({
  security: {
    rateLimit: {
      enabled: true,
      max: 100,
      window: "15m",  // 100 requests per 15 minutes
    },
    cors: {
      enabled: true,
      origin: "*",  // Public API
    },
    headers: {
      enabled: true,
    },
    sanitizeInput: true,
  },
});
```

---

### Scenario 2: Internal API

```typescript
await nnnRouterPlugin({
  security: {
    cors: {
      enabled: true,
      origin: [
        "https://dashboard.internal.com",
        "https://admin.internal.com",
      ],
      credentials: true,
    },
    headers: {
      enabled: true,
      frameGuard: "sameorigin",  // Allow internal iframes
    },
    rateLimit: {
      enabled: true,
      max: 10000,  // Higher limit for internal
      window: "1h",
    },
  },
});
```

---

### Scenario 3: SaaS Application

```typescript
await nnnRouterPlugin({
  security: {
    rateLimit: {
      enabled: true,
      max: 1000,
      window: "1h",
      keyGenerator: (request) => {
        // Rate limit per user, not IP
        return request.headers.get("x-user-id") || "anonymous";
      },
    },
    cors: {
      enabled: true,
      origin: (origin) => {
        // Allow customer subdomains
        return origin.match(/^https:\/\/[\w-]+\.customers\.example\.com$/);
      },
      credentials: true,
    },
    headers: {
      enabled: true,
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "https://cdn.example.com"],
          "connect-src": ["'self'", "https://api.example.com"],
        },
      },
    },
    csrf: true,
    sanitizeInput: true,
  },
});
```

---

## ⚠️ Important Notes

### Rate Limiting

**⚠️ In-Memory Implementation:**
- Current implementation uses in-memory storage
- Not suitable for distributed systems
- For production clusters, use Redis-based rate limiting

**Recommendation:**
```typescript
// For distributed systems
import { createRedisRateLimiter } from "@some/redis-rate-limiter";

await nnnRouterPlugin({
  security: {
    rateLimit: createRedisRateLimiter({
      redis: { host: "localhost", port: 6379 },
      max: 1000,
      window: "1h",
    }),
  },
});
```

---

### CSRF Protection

**⚠️ Requirements:**
- Client phải support cookies
- Client phải gửi token trong header
- Không work với pure REST clients (use API keys instead)

**When to use:**
- ✅ Web applications with sessions
- ✅ SPAs with authentication
- ❌ Mobile apps (use API keys)
- ❌ Server-to-server APIs

---

### Input Sanitization

**⚠️ Limitations:**
- Basic XSS protection only
- Not a replacement for validation
- May remove legitimate content (e.g., code examples)

**Recommendations:**
- ✅ Use with validation schemas
- ✅ Sanitize display output too
- ✅ Consider context-specific sanitization
- ⚠️ Disable for routes that need HTML (with proper validation)

---

## 🔍 Security Audit Checklist

### Network Security
- [ ] ✅ HTTPS enforced (HSTS)
- [ ] ✅ CORS configured correctly
- [ ] ✅ Rate limiting enabled
- [ ] ✅ Preflight requests handled

### Input Security
- [ ] ✅ Input sanitization enabled
- [ ] ✅ Schema validation on all routes
- [ ] ✅ SQL injection prevention (use ORMs)
- [ ] ✅ XSS protection

### Headers
- [ ] ✅ CSP configured
- [ ] ✅ XSS Protection header
- [ ] ✅ Frame Guard enabled
- [ ] ✅ MIME sniffing prevented

### Authentication
- [ ] ✅ CSRF protection (if using sessions)
- [ ] ✅ Secure cookies (httpOnly, secure, sameSite)
- [ ] ✅ Password hashing (bcrypt/argon2)
- [ ] ✅ JWT validation

### Monitoring
- [ ] ✅ Security event logging
- [ ] ✅ Rate limit monitoring
- [ ] ✅ Failed auth attempts tracking
- [ ] ✅ Alerts on suspicious activity

---

## 📊 Security vs Performance

### Trade-offs

| Feature | Security Gain | Performance Cost |
|---------|---------------|------------------|
| **Rate Limiting** | ⭐⭐⭐⭐⭐ High | ⚡ ~0.1ms per request |
| **CORS** | ⭐⭐⭐ Medium | ⚡ ~0.01ms |
| **Headers** | ⭐⭐⭐⭐ High | ⚡ ~0.01ms |
| **CSRF** | ⭐⭐⭐⭐ High | ⚡ ~0.05ms |
| **Sanitization** | ⭐⭐⭐ Medium | ⚡ ~0.2ms per request |

**All costs are minimal!** Security worth it! ✅

---

## 🎊 Summary

**Security features available:**

✅ **Rate Limiting** - Prevent abuse  
✅ **CORS** - Control cross-origin requests  
✅ **Security Headers** - Helmet-like protection  
✅ **CSRF** - Prevent CSRF attacks  
✅ **Input Sanitization** - Prevent XSS  

**All configurable via simple options!** 🚀

---

**See also:**
- [ERROR_HANDLING.md](./ERROR_HANDLING.md) - Error handling guide
- [VALIDATION.md](./VALIDATION.md) - Validation guide

