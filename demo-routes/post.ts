// Root route - POST /
export default ({ body }) => {
  return {
    message: "Data received at root",
    data: body,
  };
};

