# 🛡️ Security Quick Start (5 phút)

Hướng dẫn nhanh enable security features.

---

## ⚡ 1-Line Security (Khuyến nghị)

```typescript
await nnnRouterPlugin({
  dir: "routes",
  security: {
    rateLimit: { enabled: true, max: 1000, window: "1h" },
    cors: { enabled: true, origin: "https://yourapp.com" },
    headers: { enabled: true },
    sanitizeInput: true,
  }
})
```

**Done! Bạn đã có:**
- ✅ Rate limiting (1000 req/hour)
- ✅ CORS protection
- ✅ 7 security headers
- ✅ XSS protection

---

## 🎯 Pick & Choose

### Chỉ cần Rate Limiting

```typescript
security: {
  rateLimit: { enabled: true, max: 100, window: "15m" }
}
```

### Chỉ cần CORS

```typescript
security: {
  cors: { 
    enabled: true, 
    origin: "https://frontend.com" 
  }
}
```

### Chỉ cần Security Headers

```typescript
security: {
  headers: { enabled: true }
}
```

### Chỉ cần XSS Protection

```typescript
security: {
  sanitizeInput: true
}
```

---

## 🔧 Common Scenarios

### Public API

```typescript
security: {
  rateLimit: { enabled: true, max: 100, window: "15m" },
  cors: { enabled: true, origin: "*" },
  headers: { enabled: true },
  sanitizeInput: true,
}
```

### Private API (CORS strict)

```typescript
security: {
  rateLimit: { enabled: true, max: 10000, window: "1h" },
  cors: { 
    enabled: true, 
    origin: ["https://dashboard.com", "https://app.com"],
    credentials: true 
  },
  headers: { enabled: true },
  csrf: true,
  sanitizeInput: true,
}
```

### Development (Relaxed)

```typescript
security: {
  rateLimit: { enabled: false },  // Unlimited
  cors: { enabled: true, origin: "*" },  // Allow all
  headers: { enabled: false },  // No headers
}
```

---

## 📊 Security Levels

### Level 1: Basic (Minimal)

```typescript
security: {
  sanitizeInput: true,  // Just XSS protection
}
```

**Protection:** ⭐⭐ Basic

---

### Level 2: Standard (Recommended)

```typescript
security: {
  rateLimit: { enabled: true },
  cors: { enabled: true, origin: "https://yourapp.com" },
  headers: { enabled: true },
  sanitizeInput: true,
}
```

**Protection:** ⭐⭐⭐⭐ Good

---

### Level 3: Advanced (Maximum)

```typescript
security: {
  rateLimit: { enabled: true, max: 1000, window: "1h" },
  cors: {
    enabled: true,
    origin: ["https://yourapp.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
  headers: {
    enabled: true,
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  },
  csrf: true,
  sanitizeInput: true,
}
```

**Protection:** ⭐⭐⭐⭐⭐ Maximum

---

## ✅ Quick Checklist

Copy-paste này vào code:

```typescript
await nnnRouterPlugin({
  dir: "routes",
  
  security: {
    // [ ] Rate limiting?
    rateLimit: { enabled: true, max: 1000, window: "1h" },
    
    // [ ] CORS needed?
    cors: { enabled: true, origin: "https://yourapp.com" },
    
    // [ ] Security headers?
    headers: { enabled: true },
    
    // [ ] CSRF protection? (if using cookies/sessions)
    csrf: true,
    
    // [ ] Input sanitization? (always recommended)
    sanitizeInput: true,
  },
})
```

**Check những gì bạn cần, xóa những gì không cần!**

---

## 🎊 Done!

Security features đã enabled. Bạn có thể:

1. **Test ngay:**
```bash
curl -I http://localhost:3000/api/users
# Xem security headers
```

2. **Check rate limiting:**
```bash
# Make nhiều requests liên tục
for i in {1..101}; do curl http://localhost:3000/api/users; done
```

3. **Verify CORS:**
```bash
curl -H "Origin: https://yourapp.com" http://localhost:3000/api/users
# Check Access-Control-* headers
```

---

**See:** [SECURITY.md](./SECURITY.md) for detailed documentation.

