import { z } from "zod";
import { createSuccessMessage } from "../../../src/index";

export const schema = {
  query: z.object({
    category: z.enum(["tech", "lifestyle", "business"]).optional(),
    published: z.enum(["true", "false"]).optional(),
  }),
  response: {
    200: z.object({
      status: z.enum(["success", "error"]),
      message: z.string(),
      result: z.array(
        z.object({
          id: z.number(),
          title: z.string(),
          content: z.string(),
          category: z.string(),
          published: z.boolean(),
          createdAt: z.string(),
        })
      ),
    }),
  },
  detail: {
    summary: "Get all posts",
    description: "Retrieve a list of blog posts with optional filtering",
    tags: ["Posts"],
  },
};

const mockPosts = [
  {
    id: 1,
    title: "Introduction to Elysia",
    content: "Elysia is a fast and modern web framework...",
    category: "tech",
    published: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    title: "Building REST APIs",
    content: "Learn how to build REST APIs with Elysia...",
    category: "tech",
    published: true,
    createdAt: "2024-01-02T00:00:00Z",
  },
  {
    id: 3,
    title: "Work-Life Balance",
    content: "Tips for maintaining work-life balance...",
    category: "lifestyle",
    published: false,
    createdAt: "2024-01-03T00:00:00Z",
  },
];

export default async ({ query }: any) => {
  let filteredPosts = [...mockPosts];

  if (query.category) {
    filteredPosts = filteredPosts.filter(
      (post) => post.category === query.category
    );
  }

  if (query.published) {
    const isPublished = query.published === "true";
    filteredPosts = filteredPosts.filter(
      (post) => post.published === isPublished
    );
  }

  return createSuccessMessage({
    message: "Posts retrieved successfully",
    result: filteredPosts,
  });
};
