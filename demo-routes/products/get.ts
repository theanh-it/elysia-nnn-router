// GET /products
export default ({ query }) => {
  const page = query.page || "1";
  const limit = query.limit || "10";

  return {
    products: [
      { id: 1, name: "Product 1", price: 100 },
      { id: 2, name: "Product 2", price: 200 },
    ],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
    },
  };
};

