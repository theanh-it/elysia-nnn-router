import { z } from "zod";
import type { RouteContext, InferSchema } from "../../../../src/types";

// Complex Zod schema
const userProfileSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    age: z.number().int().min(18).max(120),
  }),
  preferences: z.object({
    theme: z.enum(["light", "dark", "auto"]),
    language: z.enum(["en", "vi", "fr", "es"]),
    notifications: z.boolean(),
  }),
  social: z
    .object({
      twitter: z.string().url().optional(),
      github: z.string().url().optional(),
      linkedin: z.string().url().optional(),
    })
    .optional(),
  tags: z.array(z.string()).min(1).max(10),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const schema = {
  body: userProfileSchema,
  detail: {
    summary: "Type Inference Demo",
    description:
      "Demonstrates automatic type inference from Zod schemas.\n\n" +
      "**TypeScript automatically infers types:**\n" +
      "- No manual type definitions needed\n" +
      "- Full autocomplete in IDE\n" +
      "- Type safety for nested objects\n" +
      "- Optional fields handled correctly\n\n" +
      "**Try it:**\n" +
      "```json\n" +
      "{\n" +
      '  "personalInfo": {\n' +
      '    "firstName": "John",\n' +
      '    "lastName": "Doe",\n' +
      '    "email": "john@example.com",\n' +
      '    "age": 30\n' +
      "  },\n" +
      '  "preferences": {\n' +
      '    "theme": "dark",\n' +
      '    "language": "en",\n' +
      '    "notifications": true\n' +
      "  },\n" +
      '  "tags": ["typescript", "elysia"],\n' +
      '  "social": {\n' +
      '    "github": "https://github.com/example"\n' +
      "  }\n" +
      "}\n" +
      "```",
    tags: ["Type Safety"],
  },
};

// TypeScript infers this type automatically from schema!
type UserProfile = InferSchema<typeof userProfileSchema>;

// Helper function with inferred types
function formatProfile(profile: UserProfile): string {
  const { firstName, lastName } = profile.personalInfo;
  return `${firstName} ${lastName}`;
}

function getPreferencesSummary(profile: UserProfile): string {
  const { theme, language, notifications } = profile.preferences;
  return `Theme: ${theme}, Language: ${language}, Notifications: ${notifications ? "ON" : "OFF"}`;
}

export default async (ctx: RouteContext<typeof schema>) => {
  // TypeScript knows EVERYTHING about ctx.body!
  // Try typing "ctx.body." in your IDE - autocomplete magic! ✨

  const profile = ctx.body;

  // All these are fully typed:
  const firstName: string = profile.personalInfo.firstName;
  const age: number = profile.personalInfo.age;
  const theme: "light" | "dark" | "auto" = profile.preferences.theme;
  const tags: string[] = profile.tags;

  // Optional fields are properly typed:
  const github: string | undefined = profile.social?.github;

  // Call type-safe helper functions
  const formattedName = formatProfile(profile);
  const preferencesSummary = getPreferencesSummary(profile);

  return {
    success: true,
    message: "TypeScript inferred all types from Zod schema!",
    inferredProfile: {
      name: formattedName,
      preferences: preferencesSummary,
      tags: profile.tags,
      socialLinks: profile.social || {},
    },
    typeInference: {
      explanation: "Types are automatically inferred from Zod schema",
      benefits: [
        "No manual type definitions",
        "Full IDE autocomplete",
        "Compile-time type checking",
        "Refactoring safety",
      ],
      example: {
        schema: "z.object({ name: z.string(), age: z.number() })",
        inferredType: "{ name: string; age: number }",
        usage: "ctx.body.name // TypeScript knows it's a string!",
      },
    },
    detectedTypes: {
      firstName: `string (inferred from z.string())`,
      age: `number (inferred from z.number().int())`,
      theme: `"light" | "dark" | "auto" (inferred from z.enum())`,
      tags: `string[] (inferred from z.array(z.string()))`,
      social: `{ twitter?: string, github?: string } | undefined (inferred from optional object)`,
    },
    codeExample: `
// Zod schema
const schema = z.object({
  name: z.string(),
  age: z.number().int().min(18)
});

// Automatic type inference
type User = InferSchema<typeof schema>;
// { name: string; age: number }

// Use in handler
export default async (ctx: RouteContext<typeof schema>) => {
  ctx.body.name; // ✅ TypeScript knows it's string
  ctx.body.age;  // ✅ TypeScript knows it's number
  ctx.body.xyz;  // ❌ Compile error!
};
    `.trim(),
  };
};

