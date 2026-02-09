// Middleware cho /users routes
export default (context) => {
  // Thêm user context
  context.userContext = {
    authenticated: true,
    role: "user",
  };
};

