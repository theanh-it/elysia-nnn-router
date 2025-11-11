import { z } from "zod";

export const schema = {
  response: {
    200: z.object({
      success: z.boolean(),
      data: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
      }),
    }),
    401: z.object({
      success: z.boolean(),
      message: z.string(),
      hint: z.string().optional(),
    }),
  },
  detail: {
    summary: "Get user profile (Protected)",
    description:
      "Get authenticated user profile. Requires Bearer token.\n\n" +
      "**Try it:**\n" +
      "1. Click 'Authorize' button above\n" +
      "2. Enter: `Bearer demo-token`\n" +
      "3. Click 'Authorize' then 'Close'\n" +
      "4. Try the endpoint",
    tags: ["Auth"],
  },
};

export default async () => {
  // If we reach here, auth middleware has passed
  return {
    success: true,
    data: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
    },
  };
};

