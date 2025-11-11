import { z } from "zod";

export const schema = {
  body: z.object({
    files: z.any(), // Can be single File or File[] - validated in handler
    category: z.string().optional(),
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        category: z.string(),
        uploaded: z.array(
          z.object({
            filename: z.string(),
            size: z.number(),
            type: z.string(),
            url: z.string(),
          })
        ),
        uploadedAt: z.string(),
      }),
      errors: z
        .array(
          z.object({
            index: z.number().optional(),
            filename: z.string().optional(),
            error: z.string(),
            size: z.string().optional(),
            maxSize: z.string().optional(),
            type: z.string().optional(),
            allowedTypes: z.array(z.string()).optional(),
          })
        )
        .optional(),
    }),
  },
  detail: {
    summary: "Upload multiple files",
    description:
      "Upload multiple files at once with validation.\n\n" +
      "**Validation:**\n" +
      "- Maximum 10 files per request\n" +
      "- Each file max 5MB\n" +
      "- Images only (JPEG, PNG, GIF, WebP)",
    tags: ["Files"],
  },
};

export default async ({ body, error }: any) => {
  const files = body?.files;
  const category = body?.category || "uncategorized";

  // Check if files exist
  if (!files) {
    return error(400, {
      success: false,
      message: "No files uploaded",
      hint: "Please upload files using the 'files' field",
    });
  }

  // Convert to array if single file
  const fileArray = Array.isArray(files) ? files : [files];

  // Validate number of files
  if (fileArray.length > 10) {
    return error(400, {
      success: false,
      message: "Too many files",
      details: "Maximum 10 files per upload",
      received: fileArray.length,
    });
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const uploadedFiles = [];
  const errors = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];

    // Validate each file
    if (!(file instanceof File)) {
      errors.push({
        index: i,
        error: "Invalid file format",
      });
      continue;
    }

    if (file.size > maxSize) {
      errors.push({
        index: i,
        filename: file.name,
        error: "File too large",
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        maxSize: "5MB",
      });
      continue;
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push({
        index: i,
        filename: file.name,
        error: "Invalid file type",
        type: file.type,
        allowedTypes,
      });
      continue;
    }

    // File is valid
    uploadedFiles.push({
      filename: file.name,
      size: file.size,
      type: file.type,
      url: `/uploads/${Date.now()}-${i}-${file.name}`,
    });
  }

  // Return results
  return {
    success: errors.length === 0,
    message: `${uploadedFiles.length} file(s) uploaded successfully${
      errors.length > 0 ? `, ${errors.length} failed` : ""
    }`,
    data: {
      category,
      uploaded: uploadedFiles,
      uploadedAt: new Date().toISOString(),
    },
    ...(errors.length > 0 && { errors }),
  };
};
