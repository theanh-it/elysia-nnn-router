// POST /products/:id/reviews với method-level middleware
export default {
  // Method-level middleware - validation
  middleware: ({ params, body, error }) => {
    // Validate product ID
    if (!params.id) {
      return error(400, { message: "Product ID is required" });
    }

    // Validate review data
    if (!body.rating || !body.comment) {
      return error(400, { message: "Rating and comment are required" });
    }

    if (body.rating < 1 || body.rating > 5) {
      return error(400, { message: "Rating must be between 1 and 5" });
    }
  },

  // Route handler
  default: ({ params, body }) => {
    return {
      message: "Review created successfully",
      review: {
        id: Date.now(),
        productId: params.id,
        rating: body.rating,
        comment: body.comment,
        createdAt: new Date().toISOString(),
      },
    };
  },
};
