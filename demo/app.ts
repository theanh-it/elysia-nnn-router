import { Elysia } from "elysia";
import { nnnRouterPlugin } from "../src/index";

const app = new Elysia();

// Use nnn-router with Swagger enabled
app.use(
  await nnnRouterPlugin({
    dir: "demo/routes",
    prefix: "api",
    swagger: {
      enabled: true,
      path: "/docs",
      autoDarkMode: true,
      documentation: {
        info: {
          title: "NNN Router Demo API",
          version: "1.0.0",
          description:
            "Demo application showcasing elysia-nnn-router features:\n\n" +
            "✅ File-based routing\n" +
            "✅ Automatic schema validation with Zod\n" +
            "✅ Auto-generated Swagger documentation\n" +
            "✅ Directory-level middleware\n" +
            "✅ Method-level middleware\n" +
            "✅ Dynamic routes\n\n" +
            "Try the interactive API below!",
        },
        tags: [
          {
            name: "Users",
            description: "User management endpoints with full CRUD operations",
          },
          {
            name: "Posts",
            description: "Blog post management with validation",
          },
          {
            name: "Auth",
            description: "Authentication examples with middleware",
          },
        ],
      },
    },
  })
);

// Root endpoint
app.get("/", () => ({
  message: "Welcome to NNN Router Demo! 🚀",
  docs: "/docs",
  features: [
    "File-based routing",
    "Zod schema validation",
    "Swagger documentation",
    "Middleware support",
    "Dynamic routes",
  ],
}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 NNN Router Demo Server");
  console.log(`📍 Server running at http://localhost:${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/docs`);
  console.log("\n✨ Features:");
  console.log("  • File-based routing");
  console.log("  • Zod schema validation");
  console.log("  • Auto-generated Swagger docs");
  console.log("  • Middleware cascading");
  console.log("  • Dynamic routes\n");
});
