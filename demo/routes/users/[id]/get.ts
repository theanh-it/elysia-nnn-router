import { z } from "zod";

export const schema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      data: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
        createdAt: z.string(),
      }),
    }),
    404: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  detail: {
    summary: "Get user by ID",
    description: "Retrieve a single user by their ID",
    tags: ["Users"],
  },
};

const mockUsers: any = {
  "1": {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z",
  },
  "2": {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    createdAt: "2024-01-02T00:00:00Z",
  },
};

export default async ({ params, error }: any) => {
  const user = mockUsers[params.id];

  if (!user) {
    return error(404, {
      success: false,
      message: `User with ID ${params.id} not found`,
    });
  }

  return {
    success: true,
    data: user,
  };
};

