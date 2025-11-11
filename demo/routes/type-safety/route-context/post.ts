import { z } from "zod";
import type { RouteContext } from "../../../../src/types";

export const schema = {
  body: z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
  }),
  query: z.object({
    sendEmail: z.enum(["yes", "no"]).optional(),
    locale: z.enum(["en", "vi", "fr"]).default("en"),
  }),
  params: z.object({
    accountId: z.string().regex(/^[0-9]+$/),
  }),
  headers: z.object({
    "x-api-key": z.string().optional(),
    "user-agent": z.string().optional(),
  }),
  detail: {
    summary: "RouteContext Type Safety Demo",
    description:
      "Demonstrates fully typed RouteContext.\n\n" +
      "**All context properties are typed:**\n" +
      "- `ctx.body` - Typed from body schema\n" +
      "- `ctx.query` - Typed from query schema\n" +
      "- `ctx.params` - Typed from params schema\n" +
      "- `ctx.headers` - Typed from headers schema\n" +
      "- `ctx.set` - Response manipulation\n" +
      "- `ctx.request` - Native Request object\n\n" +
      "**Try it:**\n" +
      "```\n" +
      "POST /api/type-safety/route-context/12345?sendEmail=yes&locale=vi\n" +
      "Headers: x-api-key: secret123\n" +
      "Body: { \"username\": \"johndoe\", \"email\": \"john@example.com\" }\n" +
      "```",
    tags: ["Type Safety"],
  },
};

// Helper function with typed context
function extractContextInfo(ctx: RouteContext<typeof schema>) {
  return {
    // All these are fully typed!
    username: ctx.body.username,           // string
    email: ctx.body.email,                 // string
    accountId: ctx.params.accountId,       // string
    sendEmail: ctx.query.sendEmail,        // "yes" | "no" | undefined
    locale: ctx.query.locale,              // "en" | "vi" | "fr"
    apiKey: ctx.headers["x-api-key"],      // string | undefined
    userAgent: ctx.headers["user-agent"],  // string | undefined
  };
}

export default async (ctx: RouteContext<typeof schema>) => {
  // TypeScript knows ALL these types!
  
  // Body (from POST request)
  const username: string = ctx.body.username;
  const email: string = ctx.body.email;
  
  // Query parameters
  const sendEmail: "yes" | "no" | undefined = ctx.query.sendEmail;
  const locale: "en" | "vi" | "fr" = ctx.query.locale; // Has default
  
  // URL parameters
  const accountId: string = ctx.params.accountId;
  
  // Headers
  const apiKey: string | undefined = ctx.headers["x-api-key"];
  const userAgent: string | undefined = ctx.headers["user-agent"];

  // Response manipulation (also typed!)
  ctx.set.headers["X-Custom-Header"] = "typed-value";
  ctx.set.headers["X-User-Id"] = accountId;

  // Extract all info using helper
  const contextInfo = extractContextInfo(ctx);

  // Conditional logic with type safety
  const shouldSendEmail = sendEmail === "yes";
  const greeting = locale === "en" ? "Hello" : locale === "vi" ? "Xin chào" : "Bonjour";

  return {
    success: true,
    message: "All context properties are fully typed!",
    greeting: `${greeting}, ${username}!`,
    extractedData: {
      user: {
        username,
        email,
        accountId,
      },
      preferences: {
        sendEmail: shouldSendEmail,
        locale,
      },
      request: {
        apiKey: apiKey ? "***" + apiKey.slice(-4) : "not provided",
        userAgent: userAgent || "unknown",
      },
    },
    contextInfo,
    typeSafety: {
      body: {
        types: {
          username: "string (min: 3, max: 20)",
          email: "string (email format)",
        },
        autocomplete: "✅ IDE suggests: ctx.body.username, ctx.body.email",
      },
      query: {
        types: {
          sendEmail: '"yes" | "no" | undefined (optional)',
          locale: '"en" | "vi" | "fr" (has default)',
        },
        autocomplete: "✅ IDE suggests: ctx.query.sendEmail, ctx.query.locale",
      },
      params: {
        types: {
          accountId: "string (numeric pattern)",
        },
        autocomplete: "✅ IDE suggests: ctx.params.accountId",
      },
      headers: {
        types: {
          "x-api-key": "string | undefined (optional)",
          "user-agent": "string | undefined (optional)",
        },
        autocomplete: '✅ IDE suggests: ctx.headers["x-api-key"]',
      },
    },
    benefits: [
      "✅ No manual type casting needed",
      "✅ Full autocomplete in IDE",
      "✅ Impossible to access non-existent fields",
      "✅ Typos caught at compile-time",
      "✅ Safe refactoring across codebase",
    ],
    example: {
      code: `
// Define typed schema
export const schema = {
  body: z.object({ name: z.string() }),
  query: z.object({ page: z.string() }),
  params: z.object({ id: z.string() })
};

// Use typed context
export default async (ctx: RouteContext<typeof schema>) => {
  ctx.body.name;    // ✅ string (autocomplete works!)
  ctx.query.page;   // ✅ string (autocomplete works!)
  ctx.params.id;    // ✅ string (autocomplete works!)
  ctx.body.unknown; // ❌ Compile error!
};
      `.trim(),
    },
  };
};

