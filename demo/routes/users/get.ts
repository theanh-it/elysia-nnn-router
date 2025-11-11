import { z } from "zod";

// Schema validation for query parameters
export const schema = {
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default("1"),
    limit: z.string().regex(/^\d+$/).optional().default("10"),
    search: z.string().optional(),
    role: z.enum(["user", "admin", "guest"]).optional(),
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      data: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
          role: z.string(),
          createdAt: z.string(),
        })
      ),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
      }),
    }),
  },
  detail: {
    summary: "Get all users",
    description: "Retrieve a paginated list of users with optional filtering",
    tags: ["Users"],
  },
};

// Mock database
const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    createdAt: "2024-01-02T00:00:00Z",
  },
  {
    id: 3,
    name: "Bob Wilson",
    email: "bob@example.com",
    role: "user",
    createdAt: "2024-01-03T00:00:00Z",
  },
  {
    id: 4,
    name: "Alice Brown",
    email: "alice@example.com",
    role: "guest",
    createdAt: "2024-01-04T00:00:00Z",
  },
];

export default async ({ query }: any) => {
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");

  let filteredUsers = [...mockUsers];

  // Apply role filter
  if (query.role) {
    filteredUsers = filteredUsers.filter((user) => user.role === query.role);
  }

  // Apply search filter
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    );
  }

  return {
    success: true,
    data: filteredUsers,
    pagination: {
      page,
      limit,
      total: filteredUsers.length,
    },
  };
};

