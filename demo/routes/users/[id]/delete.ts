import { z } from "zod";

export const schema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
    404: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  detail: {
    summary: "Delete user",
    description: "Delete a user by ID",
    tags: ["Users"],
  },
};

export default async ({ params, error }: any) => {
  const userId = parseInt(params.id);

  if (userId > 10) {
    return error(404, {
      success: false,
      message: `User with ID ${params.id} not found`,
    });
  }

  return {
    success: true,
    message: `User with ID ${params.id} deleted successfully`,
  };
};

