import { z } from "zod";
import { createSuccessMessage } from "../../../src/index";

export const schema = {
  body: z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(100),
    content: z.string().min(10, "Content must be at least 10 characters"),
    category: z.enum(["tech", "lifestyle", "business"]),
    published: z.boolean().default(false),
  }),
  response: {
    201: z.object({
      status: z.enum(["success", "error"]),
      message: z.string(),
      result: z.object({
        id: z.number(),
        title: z.string(),
        content: z.string(),
        category: z.string(),
        published: z.boolean(),
        createdAt: z.string(),
      }),
    }),
  },
  detail: {
    summary: "Create a new post",
    description: "Create a new blog post with validation",
    tags: ["Posts"],
  },
};

export default async ({ body, set }: any) => {
  const newPost = {
    id: Math.floor(Math.random() * 10000),
    title: body.title,
    content: body.content,
    category: body.category,
    published: body.published,
    createdAt: new Date().toISOString(),
  };

  set.status = 201;

  return createSuccessMessage({
    message: "Post created successfully",
    result: newPost,
  });
};

