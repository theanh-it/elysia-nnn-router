import { z } from "zod";
import type { RouteContext } from "../../../../src/types";

// Discriminated union type
const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create"),
    data: z.object({
      title: z.string().min(3),
      content: z.string(),
      tags: z.array(z.string()),
    }),
  }),
  z.object({
    type: z.literal("update"),
    id: z.string(),
    data: z.object({
      title: z.string().min(3).optional(),
      content: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),
  z.object({
    type: z.literal("delete"),
    id: z.string(),
    reason: z.string().optional(),
  }),
  z.object({
    type: z.literal("publish"),
    id: z.string(),
    schedule: z.object({
      publishAt: z.string().datetime(),
      timezone: z.string(),
    }).optional(),
  }),
]);

export const schema = {
  body: actionSchema,
  detail: {
    summary: "Complex Types Demo",
    description:
      "Demonstrates advanced type patterns:\n\n" +
      "**Features:**\n" +
      "- Discriminated unions\n" +
      "- Type narrowing\n" +
      "- Conditional types\n" +
      "- Union type handling\n\n" +
      "**Try different actions:**\n\n" +
      "**Create:**\n" +
      "```json\n" +
      '{ "type": "create", "data": { "title": "New Post", "content": "Hello", "tags": ["typescript"] } }\n' +
      "```\n\n" +
      "**Update:**\n" +
      "```json\n" +
      '{ "type": "update", "id": "123", "data": { "title": "Updated" } }\n' +
      "```\n\n" +
      "**Delete:**\n" +
      "```json\n" +
      '{ "type": "delete", "id": "123", "reason": "Spam" }\n' +
      "```\n\n" +
      "**Publish:**\n" +
      "```json\n" +
      '{ "type": "publish", "id": "123", "schedule": { "publishAt": "2025-12-01T10:00:00Z", "timezone": "UTC" } }\n' +
      "```",
    tags: ["Type Safety"],
  },
};

export default async (ctx: RouteContext<typeof schema>) => {
  const action = ctx.body;

  // TypeScript narrows the type based on discriminator!
  // This is called "type narrowing" or "type discrimination"
  
  let result: any;
  let typeNarrowing: string;

  switch (action.type) {
    case "create":
      // TypeScript knows action has 'data' field with title, content, tags
      result = {
        created: true,
        title: action.data.title,
        content: action.data.content,
        tags: action.data.tags,
        timestamp: new Date().toISOString(),
      };
      typeNarrowing = `Type narrowed to: { type: "create", data: {...} }`;
      break;

    case "update":
      // TypeScript knows action has 'id' and optional 'data' fields
      result = {
        updated: true,
        id: action.id,
        changes: action.data,
        timestamp: new Date().toISOString(),
      };
      typeNarrowing = `Type narrowed to: { type: "update", id: string, data?: {...} }`;
      break;

    case "delete":
      // TypeScript knows action has 'id' and optional 'reason'
      result = {
        deleted: true,
        id: action.id,
        reason: action.reason || "No reason provided",
        timestamp: new Date().toISOString(),
      };
      typeNarrowing = `Type narrowed to: { type: "delete", id: string, reason?: string }`;
      break;

    case "publish":
      // TypeScript knows action has 'id' and optional 'schedule'
      result = {
        published: true,
        id: action.id,
        schedule: action.schedule,
        immediate: !action.schedule,
        timestamp: new Date().toISOString(),
      };
      typeNarrowing = `Type narrowed to: { type: "publish", id: string, schedule?: {...} }`;
      break;

    default:
      // TypeScript ensures this is never reached (exhaustive check)
      const _exhaustive: never = action;
      return _exhaustive;
  }

  return {
    success: true,
    message: `Action '${action.type}' processed with type safety!`,
    result,
    typeSafety: {
      discriminatedUnion: {
        explanation:
          "Union type where TypeScript can narrow based on discriminator field",
        discriminator: "type",
        variants: ["create", "update", "delete", "publish"],
        benefit:
          "Each case has different fields, TypeScript knows them all!",
      },
      typeNarrowing,
      exhaustiveCheck:
        "TypeScript ensures all cases are handled (never type)",
    },
    advancedFeatures: {
      discriminatedUnions: {
        description: "Type-safe union with discriminator field",
        example: `
z.discriminatedUnion("type", [
  z.object({ type: z.literal("A"), valueA: z.string() }),
  z.object({ type: z.literal("B"), valueB: z.number() })
])
        `.trim(),
      },
      typeNarrowing: {
        description: "TypeScript narrows type in switch/if statements",
        example: `
if (action.type === "create") {
  action.data.title; // ✅ TypeScript knows this exists
}
        `.trim(),
      },
      exhaustivenessCheck: {
        description: "Ensures all union variants are handled",
        example: `
default:
  const _exhaustive: never = action;
  return _exhaustive; // Compile error if case missed!
        `.trim(),
      },
    },
    benefits: [
      "✅ Type-safe based on action type",
      "✅ Autocomplete shows correct fields",
      "✅ Impossible to access wrong fields",
      "✅ Compiler ensures all cases handled",
      "✅ Refactoring is safe",
    ],
  };
};

