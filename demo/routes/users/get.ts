import { t } from "elysia";

// Schema for listing users
export const schema = {
  response: {
    200: t.Array(
      t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.Optional(t.String()),
      })
    ),
  },
};

export const detail = {
  summary: "List all users",
  description: "Returns a list of all registered users in the system",
  tags: ["Users"],
};

export default () => {
  return [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
  ];
};
