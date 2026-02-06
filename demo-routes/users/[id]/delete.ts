// DELETE /users/:id
export default ({ params }) => {
  return {
    message: `User ${params.id} deleted successfully`,
  };
};

