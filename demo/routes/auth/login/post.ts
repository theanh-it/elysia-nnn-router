import { z } from "zod";

export const schema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(10),
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        token: z.string(),
        user: z.object({
          id: z.number(),
          email: z.string(),
          name: z.string(),
        }),
      }),
    }),
    401: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  detail: {
    summary: "Login (Public)",
    description:
      "Login to get authentication token. This endpoint is public and doesn't require auth.\n\n" +
      "**Test credentials:**\n" +
      "- Email: demo@example.com\n" +
      "- Password: password123\n\n" +
      "You'll get a token to use in other protected endpoints.",
    tags: ["Auth"],
  },
};

export default async ({ body, error }: any) => {
  // Mock login validation
  if (body.email === "demo@example.com" && body.password === "password123") {
    return {
      success: true,
      message: "Login successful",
      data: {
        token: "demo-token",
        user: {
          id: 1,
          email: body.email,
          name: "Demo User",
        },
      },
    };
  }

  return error(401, {
    success: false,
    message: "Invalid credentials",
  });
};
