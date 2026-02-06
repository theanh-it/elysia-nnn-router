// GET /products/:id
export default ({ params }) => {
  return {
    product: {
      id: params.id,
      name: `Product ${params.id}`,
      price: 100 * parseInt(params.id) || 0,
      description: `Description for product ${params.id}`,
    },
  };
};

