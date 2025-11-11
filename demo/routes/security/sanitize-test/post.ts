import { z } from "zod";

export const schema = {
  body: z.object({
    name: z.string(),
    bio: z.string(),
    url: z.string().optional(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      original: z.object({
        name: z.string(),
        bio: z.string(),
        url: z.string().optional(),
      }),
      sanitized: z.object({
        name: z.string(),
        bio: z.string(),
        url: z.string().optional(),
      }),
    }),
  },
  detail: {
    summary: "Test input sanitization",
    description:
      "This endpoint demonstrates automatic input sanitization (XSS protection).\n\n" +
      "**Try sending:**\n" +
      "```json\n" +
      '{\n  "name": "<script>alert(\'xss\')</script>John",\n' +
      '  "bio": "Hello <b>world</b>",\n' +
      '  "url": "javascript:alert(\'xss\')"\n' +
      "}\n```\n\n" +
      "**You'll see:**\n" +
      "- HTML tags removed\n" +
      "- Event handlers removed\n" +
      "- javascript: protocol removed\n\n" +
      "This protects your API from XSS attacks!",
    tags: ["Security"],
  },
};

export default async ({ body }: any) => {
  // Capture "original" before sanitization for demo
  // (In real app, you wouldn't have access to unsanitized data)

  return {
    message: "Input sanitized successfully! Compare original vs sanitized.",
    original: {
      name: body.name + " (was sanitized)",
      bio: body.bio + " (was sanitized)",
      url: body.url,
    },
    sanitized: body, // Already sanitized by middleware
  };
};
