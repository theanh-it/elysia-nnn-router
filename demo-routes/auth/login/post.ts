// POST /auth/login với multiple middlewares
export default {
  // Multiple method-level middlewares
  middleware: [
    // Middleware 1: Validate input
    ({ body, error }) => {
      if (!body.email || !body.password) {
        return error(400, { message: "Email and password are required" });
      }
    },
    // Middleware 2: Validate email format
    ({ body, error }) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return error(400, { message: "Invalid email format" });
      }
    },
    // Middleware 3: Validate password length
    ({ body, error }) => {
      if (body.password.length < 6) {
        return error(400, { message: "Password must be at least 6 characters" });
      }
    },
  ],

  // Route handler
  default: ({ body }) => {
    // Simulate login
    return {
      message: "Login successful",
      token: "fake-jwt-token",
      user: {
        email: body.email,
      },
    };
  },
};

