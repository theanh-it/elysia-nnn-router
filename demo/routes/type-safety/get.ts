/**
 * Type Safety Overview
 * 
 * This endpoint provides an overview of all type safety features
 */
export default async () => {
  return {
    title: "🔒 Type Safety Features",
    version: "0.2.0",
    description: "Complete type safety with TypeScript",
    
    features: {
      brandedTypes: {
        description: "Prevent ID mixing at compile-time",
        endpoint: "/api/type-safety/branded-ids",
        example: {
          input: {
            userId: "user-123",
            postId: "post-456",
            action: "like",
          },
          feature: "TypeScript prevents passing PostId where UserId expected",
        },
      },
      
      typeInference: {
        description: "Automatic type inference from Zod schemas",
        endpoint: "/api/type-safety/type-inference",
        example: {
          schema: "z.object({ name: z.string(), age: z.number() })",
          inferred: "{ name: string; age: number }",
          benefit: "No manual type definitions needed!",
        },
      },
      
      complexTypes: {
        description: "Discriminated unions and type narrowing",
        endpoint: "/api/type-safety/complex-types",
        example: {
          discriminatedUnion: {
            type: "create | update | delete | publish",
            narrowing: "TypeScript knows fields based on type",
          },
        },
      },
      
      routeContext: {
        description: "Fully typed request context",
        endpoint: "/api/type-safety/route-context/:accountId",
        example: {
          typed: [
            "ctx.body (from schema)",
            "ctx.query (from schema)",
            "ctx.params (from schema)",
            "ctx.headers (from schema)",
          ],
        },
      },
    },
    
    benefits: [
      "✅ Catch bugs at compile-time (not runtime)",
      "✅ Full autocomplete in IDE",
      "✅ Self-documenting code",
      "✅ Safe refactoring",
      "✅ Zero runtime overhead",
    ],
    
    howToUse: {
      step1: {
        title: "Define your schema with Zod",
        code: `
export const schema = {
  body: z.object({
    name: z.string(),
    age: z.number()
  })
};
        `.trim(),
      },
      
      step2: {
        title: "Use RouteContext for type-safe handler",
        code: `
import type { RouteContext } from "elysia-nnn-router";

export default async (ctx: RouteContext<typeof schema>) => {
  ctx.body.name; // ✅ TypeScript knows it's string!
  ctx.body.age;  // ✅ TypeScript knows it's number!
};
        `.trim(),
      },
      
      step3: {
        title: "Enjoy full type safety!",
        benefits: [
          "Autocomplete in your IDE",
          "Compile-time error checking",
          "No manual types needed",
        ],
      },
    },
    
    tryItOut: {
      endpoints: [
        {
          method: "POST",
          path: "/api/type-safety/branded-ids",
          description: "Demo branded types for IDs",
          body: {
            userId: "user-123",
            postId: "post-456",
            action: "like",
          },
        },
        {
          method: "POST",
          path: "/api/type-safety/type-inference",
          description: "Demo automatic type inference",
          body: {
            personalInfo: {
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              age: 30,
            },
            preferences: {
              theme: "dark",
              language: "en",
              notifications: true,
            },
            tags: ["typescript", "elysia"],
          },
        },
        {
          method: "POST",
          path: "/api/type-safety/complex-types",
          description: "Demo discriminated unions",
          examples: [
            { type: "create", data: { title: "Post", content: "...", tags: [] } },
            { type: "update", id: "123", data: { title: "Updated" } },
            { type: "delete", id: "123", reason: "Spam" },
          ],
        },
        {
          method: "POST",
          path: "/api/type-safety/route-context/12345?locale=en",
          description: "Demo fully typed context",
          body: {
            username: "johndoe",
            email: "john@example.com",
          },
        },
      ],
    },
    
    documentation: "/docs - Full API documentation",
    
    typeScript: {
      config: "Maximum strict type checking enabled",
      checks: [
        "strict: true",
        "noImplicitAny: true",
        "strictNullChecks: true",
        "noUncheckedIndexedAccess: true",
      ],
    },
  };
};

