import { t } from "elysia";

// Schema for search with query parameters
export const schema = {
  query: t.Object({
    q: t.String({ minLength: 1 }),
    page: t.Optional(t.Number({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 10 })),
  }),
  response: {
    200: t.Object({
      query: t.String(),
      page: t.Number(),
      limit: t.Number(),
      results: t.Array(
        t.Object({
          id: t.Number(),
          title: t.String(),
        })
      ),
      total: t.Number(),
    }),
  },
};

export const detail = {
  summary: "Search resources",
  description: "Search for resources with pagination support",
  tags: ["Search"],
};

export default ({ query }) => {
  return {
    query: query.q,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
    results: [
      { id: 1, title: `Result for "${query.q}" #1` },
      { id: 2, title: `Result for "${query.q}" #2` },
      { id: 3, title: `Result for "${query.q}" #3` },
    ],
    total: 3,
  };
};
