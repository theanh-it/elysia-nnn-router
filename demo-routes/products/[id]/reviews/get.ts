// GET /products/:id/reviews
export default ({ params }) => {
  return {
    productId: params.id,
    reviews: [
      { id: 1, rating: 5, comment: "Great product!" },
      { id: 2, rating: 4, comment: "Good value" },
    ],
  };
};

