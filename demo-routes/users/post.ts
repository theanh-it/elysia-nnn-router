// POST /users
export default ({ body }) => {
  return {
    message: "User created successfully",
    user: {
      id: Date.now(),
      ...body,
    },
  };
};

