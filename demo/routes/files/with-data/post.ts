import { z } from "zod";

// Example: File upload combined with structured data
export const schema = {
  body: z.object({
    file: z.any(), // File object
    title: z.string().min(3),
    description: z.string().optional(),
    tags: z.string().optional(),
    isPublic: z.string().optional(), // Will be string "true"/"false" from form
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        file: z.object({
          filename: z.string(),
          size: z.number(),
          type: z.string(),
          url: z.string(),
        }),
        metadata: z.object({
          title: z.string(),
          description: z.string().nullable(),
          tags: z.array(z.string()),
          isPublic: z.boolean(),
          createdAt: z.string(),
        }),
      }),
    }),
    400: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  detail: {
    summary: "Upload file with metadata",
    description:
      "Upload a file along with structured metadata.\n\n" +
      "**Fields:**\n" +
      "- `file`: The file to upload (required)\n" +
      "- `title`: Title (required, min 3 chars)\n" +
      "- `description`: Description (optional)\n" +
      "- `tags`: Comma-separated tags (optional)\n" +
      "- `isPublic`: Public visibility (optional)",
    tags: ["Files"],
  },
};

export default async ({ body, error }: any) => {
  const file = body?.file;
  const title = body?.title;
  const description = body?.description;
  const tags = body?.tags;
  const isPublic = body?.isPublic === "true" || body?.isPublic === true;

  // Validate file
  if (!file || !(file instanceof File)) {
    return error(400, {
      success: false,
      message: "File is required",
    });
  }

  // Validate title
  if (!title || title.length < 3) {
    return error(400, {
      success: false,
      message: "Title is required and must be at least 3 characters",
    });
  }

  // File validation
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return error(400, {
      success: false,
      message: "File too large (max 5MB)",
    });
  }

  // Parse tags
  const tagArray = tags
    ? tags
        .split(",")
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0)
    : [];

  // Return success with all data
  return {
    success: true,
    message: "File and metadata uploaded successfully",
    data: {
      file: {
        filename: file.name,
        size: file.size,
        type: file.type,
        url: `/uploads/${Date.now()}-${file.name}`,
      },
      metadata: {
        title,
        description: description || null,
        tags: tagArray,
        isPublic,
        createdAt: new Date().toISOString(),
      },
    },
  };
};

