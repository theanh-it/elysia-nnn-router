#!/bin/bash

# Test CI/CD locally before pushing to GitHub
# This simulates what GitHub Actions will do

set -e  # Exit on error

echo "🧪 Testing CI/CD Pipeline Locally"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Job 1: Test
echo "📦 Job 1: Test"
echo "---------------"

echo "  ✓ Checkout code (skipped - already local)"
echo "  ✓ Setup Bun: $(bun --version)"

echo "  → Installing dependencies..."
bun install
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

echo "  → Running tests..."
bun test
if [ $? -eq 0 ]; then
  echo -e "${GREEN}  ✓ Tests passed${NC}"
else
  echo -e "${RED}  ✗ Tests failed${NC}"
  exit 1
fi

echo "  → Building package..."
bun run build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}  ✓ Build successful${NC}"
else
  echo -e "${RED}  ✗ Build failed${NC}"
  exit 1
fi

echo "  → Checking build artifacts..."
if [ -f "dist/index.js" ] && [ -f "dist/index.d.ts" ]; then
  echo -e "${GREEN}  ✓ Build artifacts exist${NC}"
else
  echo -e "${RED}  ✗ Build artifacts missing${NC}"
  exit 1
fi

echo ""

# Job 2: Lint
echo "🔍 Job 2: Lint"
echo "---------------"

echo "  → Type checking..."
bunx tsc --noEmit
if [ $? -eq 0 ]; then
  echo -e "${GREEN}  ✓ Type check passed${NC}"
else
  echo -e "${RED}  ✗ Type check failed${NC}"
  exit 1
fi

echo ""

# Job 3: Demo
echo "🎮 Job 3: Demo"
echo "---------------"

echo "  → Starting demo server..."
bun run demo > /tmp/demo-ci-test.log 2>&1 &
DEMO_PID=$!

echo "  → Waiting for server to start..."
sleep 3

echo "  → Testing endpoints..."

# Test root endpoint
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
  echo -e "${GREEN}  ✓ GET / works${NC}"
else
  echo -e "${RED}  ✗ GET / failed${NC}"
  kill $DEMO_PID 2>/dev/null || true
  exit 1
fi

# Test docs endpoint
if curl -f http://localhost:3000/docs > /dev/null 2>&1; then
  echo -e "${GREEN}  ✓ GET /docs works${NC}"
else
  echo -e "${RED}  ✗ GET /docs failed${NC}"
  kill $DEMO_PID 2>/dev/null || true
  exit 1
fi

# Test API endpoint
if curl -f http://localhost:3000/api/posts > /dev/null 2>&1; then
  echo -e "${GREEN}  ✓ GET /api/posts works${NC}"
else
  echo -e "${RED}  ✗ GET /api/posts failed${NC}"
  kill $DEMO_PID 2>/dev/null || true
  exit 1
fi

echo "  → Stopping demo server..."
kill $DEMO_PID 2>/dev/null || true
sleep 1

echo ""

# Job 4: Coverage
echo "📊 Job 4: Coverage"
echo "-------------------"

echo "  → Running tests with coverage..."
echo -e "${YELLOW}  ⚠ Coverage reporting skipped (requires codecov setup)${NC}"
echo -e "${YELLOW}  ⚠ Will be available after pushing to GitHub${NC}"

echo ""
echo "=================================="
echo -e "${GREEN}✅ All CI/CD jobs passed locally!${NC}"
echo "=================================="
echo ""
echo "Next steps:"
echo "  1. git add .github/workflows/ci.yml"
echo "  2. git commit -m 'feat: Add CI/CD pipeline'"
echo "  3. git push origin main"
echo "  4. Check GitHub Actions tab"
echo ""

