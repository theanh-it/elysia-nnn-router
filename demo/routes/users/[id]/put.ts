import { t } from "elysia";

// Schema for updating user
export const schema = {
  params: t.Object({
    id: t.String({ minLength: 1 }),
  }),
  body: t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
    email: t.Optional(t.String({ format: "email" })),
    age: t.Optional(t.Number({ minimum: 0, maximum: 150 })),
  }),
  response: {
    200: t.Object({
      id: t.String(),
      name: t.String(),
      email: t.String(),
      age: t.Optional(t.Number()),
    }),
    404: t.Object({
      error: t.String(),
    }),
  },
};

export const detail = {
  summary: "Update user",
  description: "Updates an existing user by their ID",
  tags: ["Users"],
};

export default ({ params, body, set }) => {
  return {
    id: params.id,
    name: body.name ?? `User ${params.id}`,
    email: body.email ?? `user${params.id}@example.com`,
    age: body.age,
  };
};
