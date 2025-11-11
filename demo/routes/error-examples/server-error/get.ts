import { z } from "zod";

export const schema = {
  query: z.object({
    trigger: z.enum(["yes", "no"]).optional().default("no"),
  }),
  response: {
    200: z.object({
      message: z.string(),
    }),
  },
  detail: {
    summary: "Demo server error handling",
    description:
      "This endpoint demonstrates how server errors are handled.\n\n" +
      "**Usage:**\n" +
      "- `GET /api/error-examples/server-error?trigger=no` → Success\n" +
      "- `GET /api/error-examples/server-error?trigger=yes` → Error\n\n" +
      "When error occurs, you'll see:\n" +
      "- Custom error format (if configured)\n" +
      "- Stack trace (if debug mode enabled)\n" +
      "- Error logging (if error handler configured)\n\n" +
      "**Note:** In production, stack traces are hidden for security.",
    tags: ["Error Examples"],
  },
};

export default async ({ query }: any) => {
  if (query.trigger === "yes") {
    throw new Error("This is a simulated server error for demo purposes");
  }

  return {
    message: "No error! Set ?trigger=yes to see error handling.",
  };
};
