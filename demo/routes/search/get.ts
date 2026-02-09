// GET /search với query parameters
export default ({ query }) => {
  const { q, page = "1", limit = "10" } = query;

  if (!q) {
    return {
      message: "Please provide a search query",
      results: [],
    };
  }

  return {
    query: q,
    results: [
      { id: 1, title: `Result for "${q}"`, type: "document" },
      { id: 2, title: `Another result for "${q}"`, type: "article" },
    ],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 2,
    },
  };
};

