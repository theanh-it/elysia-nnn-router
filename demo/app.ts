import { Elysia } from "elysia";
import { nnnRouterPlugin } from "../src/index";

const app = new Elysia();

const isDev = process.env.NODE_ENV !== "production";

// Use nnn-router with ALL features enabled
app.use(
  await nnnRouterPlugin({
    dir: "demo/routes",
    prefix: "api",

    // Swagger documentation
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
            "✅ Automatic schema validation (Zod + TypeBox)\n" +
            "✅ Auto-generated Swagger documentation\n" +
            "✅ Directory-level middleware\n" +
            "✅ Method-level middleware\n" +
            "✅ Dynamic routes\n" +
            "✅ **NEW:** Advanced error handling\n" +
            "✅ **NEW:** Security features (Rate limit, CORS, Headers, Sanitization)\n\n" +
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
          {
            name: "Files",
            description: "File upload examples",
          },
          {
            name: "Security",
            description:
              "Security features demonstration (Rate limit, CORS, Headers, Sanitization)",
          },
          {
            name: "Error Examples",
            description: "Error handling demonstrations",
          },
          {
            name: "Type Safety",
            description:
              "Type safety features (Branded types, Type inference, Complex types, Typed context)",
          },
        ],
      },
    },

    // Security features (NEW!)
    security: {
      // Rate limiting
      rateLimit: {
        enabled: true,
        max: isDev ? 1000 : 100, // Higher limit in dev
        window: "1m",
        message: "Too many requests. Please try again later.",
      },

      // CORS
      cors: {
        enabled: true,
        origin: isDev ? "*" : "https://example.com", // Relaxed in dev
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
      },

      // Security headers
      headers: {
        enabled: true,
        xssProtection: true,
        noSniff: true,
        frameGuard: "sameorigin", // Allow Swagger UI iframe
        hsts: isDev
          ? false
          : {
              maxAge: 31536000,
              includeSubDomains: true,
            },
        // Relax CSP for Swagger UI (needs CDN scripts)
        contentSecurityPolicy: {
          directives: {
            "default-src": ["'self'"],
            "script-src": [
              "'self'",
              "'unsafe-inline'", // Needed for Swagger inline scripts
              "'unsafe-eval'", // Needed for WebAssembly in Swagger
              "https://cdn.jsdelivr.net", // Swagger UI CDN
            ],
            "style-src": [
              "'self'",
              "'unsafe-inline'", // Needed for Swagger styles
              "https://cdn.jsdelivr.net",
            ],
            "img-src": ["'self'", "data:", "https:"],
            "font-src": [
              "'self'",
              "https://cdn.jsdelivr.net",
              "https://fonts.scalar.com", // Swagger UI fonts
            ],
            "connect-src": ["'self'"],
          },
        },
      },

      // Input sanitization (XSS protection)
      sanitizeInput: true,

      // CSRF protection (disabled in demo for easier testing)
      csrf: false,
    },

    // Error handling (NEW!)
    errorHandling: {
      debug: isDev, // Show stack traces in development

      // Log all errors
      onError: (context, set) => {
        console.error(
          `❌ Error in ${context.method} ${context.path}:`,
          context.error?.message
        );

        // Custom error format for NOT_FOUND
        if (context.code === "NOT_FOUND") {
          set.status = 404;
          return {
            status: "error",
            message: "Endpoint not found",
            path: context.path,
            suggestion: "Check /docs for available endpoints",
          };
        }
      },

      // Track route load failures
      onRouteLoadError: (error) => {
        console.error(
          `⚠️  Failed to load route: ${error.method} ${error.path}`
        );
        console.error(`   Phase: ${error.phase}`);
        console.error(`   Error: ${error.error.message}`);
      },
    },
  })
);

// Root endpoint
app.get("/", () => ({
  message: "Welcome to NNN Router Demo! 🚀",
  version: "0.2.0",
  docs: "/docs",
  features: {
    routing: [
      "File-based routing",
      "Dynamic routes with [params]",
      "All HTTP methods",
      "Middleware cascading",
    ],
    validation: [
      "Zod schema validation",
      "TypeBox validation",
      "Auto-generated Swagger docs",
      "Custom error formatting",
    ],
    security: [
      "Rate limiting (1000 req/min in dev)",
      "CORS configuration",
      "Security headers (7 headers)",
      "Input sanitization (XSS protection)",
    ],
    errorHandling: [
      "Custom error handlers",
      "Debug mode (development)",
      "Route load error tracking",
      "Validation error formatting",
    ],
    typeSafety: [
      "Branded types for IDs",
      "Automatic type inference",
      "Fully typed RouteContext",
      "Discriminated unions",
      "Zero runtime overhead",
    ],
  },
  endpoints: {
    examples: {
      security: "/api/security/rate-limit-test",
      errorHandling: "/api/error-examples/validation-error",
      typeSafety: "/api/type-safety",
      crud: "/api/users",
      auth: "/api/auth/login",
      files: "/api/files/upload",
    },
  },
}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 NNN Router Demo Server v0.2.0");
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📚 Swagger: http://localhost:${PORT}/docs`);
  console.log("\n✨ Core Features:");
  console.log("  • File-based routing");
  console.log("  • Zod + TypeBox validation");
  console.log("  • Auto-generated Swagger docs");
  console.log("  • Middleware cascading");
  console.log("  • Dynamic routes");
  console.log("\n🛡️  Security Features (NEW!):");
  console.log("  • Rate limiting (1000 req/min)");
  console.log("  • CORS enabled");
  console.log("  • Security headers (7 headers)");
  console.log("  • Input sanitization (XSS protection)");
  console.log("\n⚠️  Error Handling (NEW!):");
  console.log("  • Custom error formatters");
  console.log("  • Debug mode (development)");
  console.log("  • Error tracking & logging");
  console.log("\n🔒 Type Safety (NEW!):");
  console.log("  • Branded types for IDs");
  console.log("  • Automatic type inference");
  console.log("  • Fully typed RouteContext");
  console.log("  • Zero runtime overhead");
  console.log("\n🧪 Try Demo Endpoints:");
  console.log(
    `  • Type Safety: http://localhost:${PORT}/api/type-safety`
  );
  console.log(
    `  • Security:    http://localhost:${PORT}/api/security/rate-limit-test`
  );
  console.log(
    `  • Errors:      http://localhost:${PORT}/api/error-examples/server-error?trigger=yes`
  );
  console.log(`  • CRUD:        http://localhost:${PORT}/api/users`);
  console.log("");
});
