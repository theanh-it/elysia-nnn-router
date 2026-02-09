// GET /users/:id
export default ({ params }) => {
  return {
    user: {
      id: params.id,
      name: `User ${params.id}`,
      email: `user${params.id}@example.com`,
    },
  };
};

