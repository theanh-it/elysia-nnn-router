import { z } from "zod";

export const schema = {
  response: {
    200: z.object({
      message: z.string(),
      corsHeaders: z.object({
        origin: z.string(),
        methods: z.string(),
        credentials: z.string().optional(),
      }),
    }),
  },
  detail: {
    summary: "Test CORS configuration",
    description:
      "This endpoint demonstrates CORS (Cross-Origin Resource Sharing).\n\n" +
      "Try calling from different origins to see CORS headers.\n\n" +
      "**CORS Configuration:**\n" +
      "- Allowed origins: https://example.com\n" +
      "- Allowed methods: GET, POST, PUT, DELETE\n" +
      "- Credentials: Supported\n\n" +
      "**Headers to check:**\n" +
      "- `Access-Control-Allow-Origin`\n" +
      "- `Access-Control-Allow-Methods`\n" +
      "- `Access-Control-Allow-Credentials`",
    tags: ["Security"],
  },
};

export default async ({ request, set }: any) => {
  return {
    message: "CORS is configured! Check response headers.",
    corsHeaders: {
      origin: set.headers?.["Access-Control-Allow-Origin"] || "not set",
      methods: set.headers?.["Access-Control-Allow-Methods"] || "not set",
      credentials: set.headers?.["Access-Control-Allow-Credentials"],
    },
  };
};
