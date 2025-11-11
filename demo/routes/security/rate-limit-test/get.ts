import { z } from "zod";

export const schema = {
  response: {
    200: z.object({
      message: z.string(),
      rateLimit: z.object({
        limit: z.string(),
        remaining: z.string(),
      }),
    }),
  },
  detail: {
    summary: "Test rate limiting",
    description:
      "This endpoint demonstrates rate limiting.\n\n" +
      "Try making multiple requests rapidly to see rate limiting in action.\n\n" +
      "**Rate limit:** 10 requests per minute\n" +
      "**Headers:**\n" +
      "- `X-RateLimit-Limit`: Maximum requests allowed\n" +
      "- `X-RateLimit-Remaining`: Remaining requests\n" +
      "- `Retry-After`: Seconds to wait (when blocked)",
    tags: ["Security"],
  },
};

export default async ({ request, set }: any) => {
  const limit = set.headers?.["X-RateLimit-Limit"] || "unknown";
  const remaining = set.headers?.["X-RateLimit-Remaining"] || "unknown";

  return {
    message: "Rate limiting is active! Check response headers.",
    rateLimit: {
      limit,
      remaining,
    },
  };
};
