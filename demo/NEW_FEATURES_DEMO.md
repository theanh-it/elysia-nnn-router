# 🎮 New Features Demo Guide

Demo app đã được cập nhật với TẤT CẢ tính năng mới của v0.2.0!

---

## 🚀 Start Demo

```bash
cd elysia-nnn-router
bun run demo

# Server: http://localhost:3000
# Docs:   http://localhost:3000/docs
```

---

## 🆕 New Features Added

### 1. Security Features (7 routes mới)
### 2. Error Handling Examples (3 routes mới)

**Total routes:** 19 (từ 12 routes ban đầu)

---

## 🛡️ SECURITY FEATURES DEMO

### 1. Rate Limiting

**Endpoint:** `GET /api/security/rate-limit-test`

**Try it:**
```bash
# Single request
curl http://localhost:3000/api/security/rate-limit-test

# Response:
{
  "message": "Rate limiting is active!",
  "rateLimit": {
    "limit": "1000",
    "remaining": "999"
  }
}

# Check headers:
curl -I http://localhost:3000/api/security/rate-limit-test
# X-RateLimit-Limit: 1000
# X-RateLimit-Remaining: 999
```

**Test rate limiting:**
```bash
# Make nhiều requests liên tục
for i in {1..1005}; do
  curl -s http://localhost:3000/api/security/rate-limit-test | grep -o "remaining.*" | head -1
done

# Request thứ 1001 sẽ bị block:
# HTTP 429 Too Many Requests
# Retry-After: 60
```

**Trong Swagger:**
- Mở http://localhost:3000/docs
- Tìm "Security" tag
- Thử endpoint "Test rate limiting"

---

### 2. CORS Configuration

**Endpoint:** `GET /api/security/cors-test`

**Try it:**
```bash
curl http://localhost:3000/api/security/cors-test

# Response shows CORS headers:
{
  "message": "CORS is configured!",
  "corsHeaders": {
    "origin": "*",
    "methods": "GET, POST, PUT, DELETE, PATCH",
    "credentials": "true"
  }
}

# Check headers:
curl -I http://localhost:3000/api/security/cors-test
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
# Access-Control-Allow-Credentials: true
```

**Test from browser:**
```javascript
// Open browser console on https://example.com
fetch("http://localhost:3000/api/security/cors-test")
  .then(r => r.json())
  .then(console.log);

// CORS headers allow cross-origin request
```

---

### 3. Security Headers

**Endpoint:** `GET /api/security/headers-test`

**Try it:**
```bash
curl -I http://localhost:3000/api/security/headers-test

# You'll see:
Content-Security-Policy: default-src 'self'; ...
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Response body:**
```json
{
  "message": "Security headers are set!",
  "securityHeaders": {
    "Content-Security-Policy": "...",
    "X-XSS-Protection": "1; mode=block",
    "X-Content-Type-Options": "nosniff",
    // ... all 7 headers
  }
}
```

---

### 4. Input Sanitization (XSS Protection)

**Endpoint:** `POST /api/security/sanitize-test`

**Try it:**
```bash
# Send XSS attack payload
curl -X POST http://localhost:3000/api/security/sanitize-test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"xss\")</script>John",
    "bio": "Hello <b>world</b>",
    "url": "javascript:alert(\"xss\")"
  }'

# Response shows sanitization:
{
  "message": "Input sanitized successfully!",
  "sanitized": {
    "name": "scriptalert(\"xss\")/scriptJohn",  // Tags removed!
    "bio": "Hello bworld/b",                     // Tags removed!
    "url": "alert(\"xss\")"                      // javascript: removed!
  }
}
```

**What gets removed:**
- `<script>`, `<iframe>`, `<object>` tags
- Event handlers: `onclick=`, `onload=`
- `javascript:` protocol
- Dangerous characters: `<`, `>`

**Test in Swagger:**
1. Go to http://localhost:3000/docs
2. Find "Security" → "Test input sanitization"
3. Try sending XSS payloads
4. See sanitized output

---

## ⚠️ ERROR HANDLING DEMO

### 1. Validation Errors

**Endpoint:** `POST /api/error-examples/validation-error`

**Try invalid data:**
```bash
curl -X POST http://localhost:3000/api/error-examples/validation-error \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "123",
    "age": 15,
    "username": "a"
  }'

# Response (422 Unprocessable Entity):
{
  "status": "error",
  "message": "Validation error",
  "result": {
    "email": "Expected string to match 'email' format",
    "password": "Expected string length greater or equal to 8",
    "age": "Expected integer to be greater or equal to 18",
    "username": "Expected string length greater or equal to 3"
  }
}
```

**Try valid data:**
```bash
curl -X POST http://localhost:3000/api/error-examples/validation-error \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "age": 25,
    "username": "john_doe"
  }'

# Response (200 OK):
{
  "success": true,
  "message": "All validation passed!"
}
```

---

### 2. Server Errors (with Debug Mode)

**Endpoint:** `GET /api/error-examples/server-error`

**Normal response:**
```bash
curl http://localhost:3000/api/error-examples/server-error

# Success:
{
  "message": "No error! Set ?trigger=yes to see error handling."
}
```

**Trigger error:**
```bash
curl http://localhost:3000/api/error-examples/server-error?trigger=yes

# Error response (with debug mode):
{
  "status": "error",
  "message": "This is a simulated server error for demo purposes",
  "code": "UNKNOWN",
  "stack": "Error: ...\n    at handler (...)",  // Stack trace (debug mode)
  "path": "/api/error-examples/server-error",
  "method": "GET"
}
```

**Note:** Stack trace chỉ hiện ở development (debug mode = true)

---

### 3. Custom Error Responses

**Endpoint:** `POST /api/error-examples/custom-error`

**Try different actions:**

**Success:**
```bash
curl -X POST http://localhost:3000/api/error-examples/custom-error \
  -H "Content-Type: application/json" \
  -d '{"action": "success"}'

# 200 OK
{ "success": true, "action": "success" }
```

**Not Found (404):**
```bash
curl -X POST http://localhost:3000/api/error-examples/custom-error \
  -H "Content-Type: application/json" \
  -d '{"action": "not-found"}'

# 404 Not Found
{
  "status": "error",
  "message": "Resource not found",
  "code": "NOT_FOUND"
}
```

**Forbidden (403):**
```bash
curl -X POST http://localhost:3000/api/error-examples/custom-error \
  -H "Content-Type: application/json" \
  -d '{"action": "forbidden"}'

# 403 Forbidden
{
  "status": "error",
  "message": "Access forbidden",
  "code": "FORBIDDEN"
}
```

**Custom Format (400):**
```bash
curl -X POST http://localhost:3000/api/error-examples/custom-error \
  -H "Content-Type: application/json" \
  -d '{"action": "custom"}'

# 400 Bad Request
{
  "status": "error",
  "message": "Custom error format using helper",
  "result": {
    "customField": "This uses the createErrorMessage helper"
  }
}
```

---

## 📚 Swagger UI Exploration

### Navigate to: http://localhost:3000/docs

### New Sections

**1. Security Tag (4 endpoints):**
- ✅ Test rate limiting
- ✅ Test CORS configuration
- ✅ Test security headers
- ✅ Test input sanitization

**2. Error Examples Tag (3 endpoints):**
- ✅ Demo validation errors
- ✅ Demo server error handling
- ✅ Demo custom error responses

---

## 🧪 Interactive Testing

### In Swagger UI:

**1. Test Rate Limiting:**
- Go to "Security" → "Test rate limiting"
- Click "Try it out" → "Execute"
- Repeat nhiều lần để xem rate limit headers

**2. Test Input Sanitization:**
- Go to "Security" → "Test input sanitization"
- Input:
  ```json
  {
    "name": "<script>alert('xss')</script>Hacker",
    "bio": "I am <b>bold</b>",
    "url": "javascript:alert('pwned')"
  }
  ```
- Execute and see sanitized output!

**3. Test Validation Errors:**
- Go to "Error Examples" → "Demo validation errors"
- Try invalid email, short password, young age
- See detailed error messages per field

**4. Test Server Errors:**
- Go to "Error Examples" → "Demo server error handling"
- Set `trigger=yes` in query
- See error with stack trace (debug mode)

---

## 📊 Feature Comparison

### Before (v0.1.0)
```
Routes: 12
Tags: 3 (Users, Posts, Auth)
Features:
  ✅ Routing
  ✅ Validation
  ✅ Swagger
  ❌ Security
  ❌ Error handling
```

### After (v0.2.0)
```
Routes: 19 (+7)
Tags: 6 (+3: Files, Security, Error Examples)
Features:
  ✅ Routing
  ✅ Validation
  ✅ Swagger
  ✅ Security (4 features)
  ✅ Error handling (3 features)
```

---

## 🎯 What's Demonstrated

### Security
✅ Rate limiting with headers  
✅ CORS configuration  
✅ Security headers (7 headers)  
✅ Input sanitization (XSS prevention)  

### Error Handling
✅ Validation error formatting  
✅ Server error with stack traces  
✅ Custom error responses  
✅ Debug mode information  

### Advanced Features
✅ Custom error formatters  
✅ Error callbacks & logging  
✅ Environment-based config  
✅ Lazy-loading security features  

---

## 📝 Configuration Shown

### In demo/app.ts

```typescript
await nnnRouterPlugin({
  dir: "demo/routes",
  prefix: "api",
  
  // Swagger
  swagger: { enabled: true },
  
  // Security (NEW!)
  security: {
    rateLimit: { enabled: true, max: 1000, window: "1m" },
    cors: { enabled: true, origin: "*" },
    headers: { enabled: true },
    sanitizeInput: true,
  },
  
  // Error handling (NEW!)
  errorHandling: {
    debug: true,  // Development mode
    onError: (ctx, set) => { /* custom logic */ },
    onRouteLoadError: (error) => { /* track failures */ },
  },
})
```

---

## 🎊 Summary

**Demo app showcases:**

✅ **19 total routes** (7 new)  
✅ **6 Swagger tags** (3 new)  
✅ **4 security features** demonstrated  
✅ **3 error handling** patterns  
✅ **Interactive testing** trong Swagger UI  
✅ **Real-world examples** với detailed descriptions  

**Best demo app for an Elysia router!** 🏆

---

## 📖 Next Steps

1. **Explore Swagger UI:** http://localhost:3000/docs
2. **Try security endpoints** và xem headers
3. **Test error handling** với invalid data
4. **Read route files** trong `demo/routes/` để xem code
5. **Experiment** với different configurations

---

**Last Updated:** 2025-11-10  
**Demo Version:** 0.2.0  
**Routes:** 19  
**Features:** Complete ✅

