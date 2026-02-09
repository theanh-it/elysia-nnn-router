// PUT /users/:id
export default ({ params, body }) => {
  return {
    message: "User updated",
    user: {
      id: params.id,
      ...body,
    },
  };
};

