// GET /api/v1/posts/:postId/comments/:commentId
export default ({ params }) => {
  return {
    comment: {
      id: params.commentId,
      postId: params.postId,
      content: `Comment ${params.commentId} for post ${params.postId}`,
    },
  };
};

