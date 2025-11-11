import { z } from "zod";
import { Type } from "@sinclair/typebox";

// Define schema with file field
// For Swagger to recognize multipart/form-data, we need to explicitly define body schema
export const schema = {
  body: z.object({
    file: z.any(), // File type - will be File object in handler
    description: z.string().optional(),
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        filename: z.string(),
        size: z.number(),
        type: z.string(),
        description: z.string(),
        uploadedAt: z.string(),
        url: z.string(),
      }),
    }),
    400: z.object({
      success: z.boolean(),
      message: z.string(),
      hint: z.string().optional(),
      details: z.string().optional(),
      received: z.string().optional(),
    }),
  },
  detail: {
    summary: "Upload file",
    description:
      "Upload a single file with optional description.\n\n" +
      "**Validation:**\n" +
      "- Maximum file size: 5MB\n" +
      "- Allowed types: JPEG, PNG, GIF, WebP\n" +
      "- Description is optional",
    tags: ["Files"],
  },
};

export default async ({ body, error }: any) => {
  // In Elysia, files are automatically parsed from multipart/form-data
  const file = body?.file;
  const description = body?.description || "No description";

  // Validate file exists
  if (!file) {
    return error(400, {
      success: false,
      message: "No file uploaded",
      hint: "Please upload a file using the 'file' field",
    });
  }

  // Check if it's a valid File object
  if (!(file instanceof File)) {
    return error(400, {
      success: false,
      message: "Invalid file format",
    });
  }

  // File size validation (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return error(400, {
      success: false,
      message: "File too large",
      details: `Maximum file size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    });
  }

  // File type validation (images only for this example)
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return error(400, {
      success: false,
      message: "Invalid file type",
      details: `Only images are allowed. Allowed types: ${allowedTypes.join(", ")}`,
      received: file.type,
    });
  }

  // In a real app, you would save the file here
  // For demo, we'll just return file info
  return {
    success: true,
    message: "File uploaded successfully",
    data: {
      filename: file.name,
      size: file.size,
      type: file.type,
      description,
      uploadedAt: new Date().toISOString(),
      // In real app, you'd return the URL where file is stored
      url: `/uploads/${Date.now()}-${file.name}`,
    },
  };
};

