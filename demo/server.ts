import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { nnnRouterPlugin } from "../src/index";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Elysia NNN Router API",
          version: "1.0.0",
          description:
            "Demo API with file-based routing, schema validation, and OpenAPI support",
        },
        tags: [
          { name: "Users", description: "User management endpoints" },
          { name: "Products", description: "Product management endpoints" },
          { name: "Search", description: "Search endpoints" },
          { name: "Auth", description: "Authentication endpoints" },
        ],
      },
    })
  )
  .use(
    nnnRouterPlugin({
      dir: "demo/routes",
      // prefix: "/api",   // Uncomment to add /api prefix to all routes
      verbose: true, // Log registered routes as a table (English) after scan
      // silent: true,     // Set true to disable info logs
      // onError: (err, path) => console.error("Load failed:", path, err.message),
    })
  )
  .get("/health", () => ({ status: "ok" }))
  .listen(3000);

console.log(`
🚀 Server đang chạy tại http://localhost:3000

📖 API Documentation (Swagger UI):
   http://localhost:3000/swagger

📚 Các routes có sẵn:
  GET  /                           - Root route
  POST /                           - Root POST route
  GET  /users                      - Lấy danh sách users
  POST /users                      - Tạo user mới (với schema validation)
  GET  /users/:id                  - Lấy user theo ID (với schema validation)
  PUT  /users/:id                  - Cập nhật user (với schema validation)
  DELETE /users/:id                - Xóa user
  GET  /products                   - Lấy danh sách products
  GET  /products/:id               - Lấy product theo ID
  GET  /products/:id/reviews       - Lấy reviews của product
  POST /products/:id/reviews       - Tạo review mới
  GET  /api/v1/posts               - Lấy danh sách posts
  GET  /api/v1/posts/:postId       - Lấy post theo ID
  GET  /api/v1/posts/:postId/comments/:commentId - Lấy comment
  GET  /search?q=...                - Tìm kiếm (với query schema)
  GET  /status                     - Status endpoint
  GET  /error-example              - Error example
  GET  /async-example              - Async example
  POST /auth/login                 - Login với validation

💡 Thử các requests:
  curl http://localhost:3000/
  curl http://localhost:3000/users
  curl http://localhost:3000/users/123
  curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Test User"}'
  curl http://localhost:3000/search?q=test
`);
