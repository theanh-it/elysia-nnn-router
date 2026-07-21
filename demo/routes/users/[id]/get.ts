import { t } from "elysia";

// Schema for getting user by ID
export const schema = {
  params: t.Object({
    id: t.String({ minLength: 1 }),
  }),
  response: {
    200: t.Object({
      id: t.String(),
      name: t.String(),
      email: t.String(),
    }),
    404: t.Object({
      error: t.String(),
    }),
  },
};

export const detail = {
  summary: "Get user by ID",
  description: "Returns a single user by their ID",
  tags: ["Users"],
};

export default ({ params, set }) => {
  return {
    id: params.id,
    name: `User ${params.id}`,
    email: `user${params.id}@example.com`,
  };
};
