#!/bin/bash

echo "🧪 Testing NNN Router Demo..."
echo ""

cd "$(dirname "$0")/.."

# Start demo server in background
bun demo/app.ts > /tmp/demo-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "📍 Server started (PID: $SERVER_PID)"
echo ""

# Test endpoints
echo "1️⃣ Testing root endpoint..."
curl -s http://localhost:3000/ | jq '.' || echo "Failed"
echo ""

echo "2️⃣ Testing GET /api/users..."
curl -s http://localhost:3000/api/users | jq '.data | length' || echo "Failed"
echo ""

echo "3️⃣ Testing POST /api/users (valid)..."
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"user"}' \
  | jq '.success' || echo "Failed"
echo ""

echo "4️⃣ Testing POST /api/users (invalid - should fail)..."
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"T","email":"invalid"}' \
  | jq '.message' || echo "Failed"
echo ""

echo "5️⃣ Testing GET /api/users/1..."
curl -s http://localhost:3000/api/users/1 | jq '.data.name' || echo "Failed"
echo ""

echo "6️⃣ Testing auth (without token - should fail)..."
curl -s http://localhost:3000/api/auth/profile | jq '.message' || echo "Failed"
echo ""

echo "7️⃣ Testing login..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}' \
  | jq -r '.data.token')
echo "Token: $TOKEN"
echo ""

echo "8️⃣ Testing auth with token..."
curl -s http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.name' || echo "Failed"
echo ""

echo "9️⃣ Checking Swagger docs..."
curl -s http://localhost:3000/docs | grep -q "swagger" && echo "✅ Swagger UI available" || echo "❌ Swagger not found"
echo ""

# Cleanup
kill $SERVER_PID 2>/dev/null
echo "✅ All tests completed!"
echo ""
echo "To run demo manually:"
echo "  bun run demo"
echo "  Open http://localhost:3000/docs"

