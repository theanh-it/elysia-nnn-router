import { t } from "elysia";

// Schema for user creation
export const schema = {
  body: t.Object({
    name: t.String({ minLength: 1, maxLength: 100 }),
    email: t.String({ format: "email" }),
    age: t.Optional(t.Number({ minimum: 0, maximum: 150 })),
  }),
  response: {
    201: t.Object({
      id: t.Number(),
      name: t.String(),
      email: t.String(),
      age: t.Optional(t.Number()),
    }),
    400: t.Object({
      error: t.String(),
    }),
  },
};

export const detail = {
  summary: "Create a new user",
  description: "Creates a new user with the provided information",
  tags: ["Users"],
};

export default ({ body, set }) => {
  const user = {
    id: Date.now(),
    name: body.name,
    email: body.email,
    age: body.age,
  };

  set.status = 201;
  return user;
};
