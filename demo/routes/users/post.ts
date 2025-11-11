import { Type } from "@sinclair/typebox";

// Using pure TypeBox schema (no Zod required!)
export const schema = {
  body: Type.Object({
    name: Type.String({ minLength: 3, maxLength: 50 }),
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 8, maxLength: 20 }),
    age: Type.Optional(Type.Integer({ minimum: 18, maximum: 120 })),
    role: Type.Union([
      Type.Literal("user"),
      Type.Literal("admin"),
      Type.Literal("guest"),
    ]),
  }),
  response: {
    201: Type.Object({
      success: Type.Boolean(),
      message: Type.String(),
      data: Type.Object({
        id: Type.Number(),
        name: Type.String(),
        email: Type.String(),
        role: Type.String(),
        createdAt: Type.String({ format: "date-time" }),
      }),
    }),
  },
  detail: {
    summary: "Create a new user",
    description:
      "Create a new user account with validation. This example uses **pure TypeBox** schema (no Zod).\n\n" +
      "**Validation rules:**\n" +
      "- name: 3-50 characters\n" +
      "- email: valid email format\n" +
      "- password: 8-20 characters\n" +
      "- age: optional, 18-120\n" +
      "- role: user, admin, or guest",
    tags: ["Users"],
  },
};

export default async ({ body, set }: any) => {
  const newUser = {
    id: Math.floor(Math.random() * 10000),
    name: body.name,
    email: body.email,
    role: body.role,
    createdAt: new Date().toISOString(),
  };

  set.status = 201;

  return {
    success: true,
    message: "User created successfully",
    data: newUser,
  };
};
