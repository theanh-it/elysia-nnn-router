import { z } from "zod";

export const schema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
    role: z.enum(["user", "admin", "guest"]).optional(),
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
        updatedAt: z.string(),
      }),
    }),
    404: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  detail: {
    summary: "Update user",
    description: "Update user information by ID",
    tags: ["Users"],
  },
};

export default async ({ params, body, error }: any) => {
  // In real app, check if user exists
  const userId = parseInt(params.id);

  if (userId > 10) {
    return error(404, {
      success: false,
      message: `User with ID ${params.id} not found`,
    });
  }

  // Merge with existing data (mock)
  const updatedUser = {
    id: userId,
    name: body.name || "John Doe",
    email: body.email || "john@example.com",
    role: body.role || "user",
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  };
};

