// GET /api/v1/posts/:postId
export default ({ params }) => {
  return {
    post: {
      id: params.postId,
      title: `Post ${params.postId}`,
      content: `Content for post ${params.postId}`,
    },
  };
};

