// GET /api/v1/posts
export default () => {
  return {
    posts: [
      { id: 1, title: "Post 1", content: "Content 1" },
      { id: 2, title: "Post 2", content: "Content 2" },
    ],
  };
};

