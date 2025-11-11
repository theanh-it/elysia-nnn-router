import { z } from "zod";
import { createErrorMessage } from "../../../../src/index";

export const schema = {
  body: z.object({
    action: z.enum(["success", "not-found", "forbidden", "custom"]),
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      action: z.string(),
    }),
  },
  detail: {
    summary: "Demo custom error responses",
    description:
      "This endpoint demonstrates different error response patterns.\n\n" +
      "**Try different actions:**\n" +
      '- `{"action": "success"}` → 200 OK\n' +
      '- `{"action": "not-found"}` → 404 Not Found\n' +
      '- `{"action": "forbidden"}` → 403 Forbidden\n' +
      '- `{"action": "custom"}` → 400 Custom Error\n\n' +
      "Each error type shows different response format.",
    tags: ["Error Examples"],
  },
};

export default async ({ body, error }: any) => {
  switch (body.action) {
    case "success":
      return { success: true, action: "success" };

    case "not-found":
      return error(404, {
        status: "error",
        message: "Resource not found",
        code: "NOT_FOUND",
      });

    case "forbidden":
      return error(403, {
        status: "error",
        message: "Access forbidden",
        code: "FORBIDDEN",
      });

    case "custom":
      return error(
        400,
        createErrorMessage({
          message: "Custom error format using helper",
          result: {
            customField: "This uses the createErrorMessage helper",
          },
        })
      );

    default:
      return { success: true, action: body.action };
  }
};
