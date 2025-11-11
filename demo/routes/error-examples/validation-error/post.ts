import { z } from "zod";

export const schema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(20),
    age: z.number().int().min(18).max(120),
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  }),
  response: {
    200: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
    422: z.object({
      status: z.string(),
      message: z.string(),
      result: z.record(z.string(), z.string()),
    }),
  },
  detail: {
    summary: "Demo validation errors",
    description:
      "This endpoint demonstrates validation error handling.\n\n" +
      "**Try sending invalid data to see error responses:**\n\n" +
      "Example invalid data:\n" +
      "```json\n" +
      '{\n  "email": "not-an-email",\n' +
      '  "password": "123",\n' +
      '  "age": 15,\n' +
      '  "username": "a"\n' +
      "}\n```\n\n" +
      "**You'll receive 422 response with detailed errors for each field.**\n\n" +
      "**Validation rules:**\n" +
      "- email: must be valid email format\n" +
      "- password: 8-20 characters\n" +
      "- age: 18-120\n" +
      "- username: 3-20 chars, alphanumeric + underscore only",
    tags: ["Error Examples"],
  },
};

export default async () => {
  return {
    success: true,
    message: "All validation passed! User would be created here.",
  };
};

