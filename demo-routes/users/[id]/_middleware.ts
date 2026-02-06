// Middleware cho /users/:id routes
export default (context) => {
  // Validate user ID
  const userId = context.params?.id;
  if (userId && isNaN(parseInt(userId))) {
    return context.error(400, { message: "Invalid user ID" });
  }
};

