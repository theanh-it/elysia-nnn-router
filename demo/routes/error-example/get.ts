// GET /error-example - ví dụ về error handling
export default ({ error }) => {
  return error(404, {
    message: "Resource not found",
    code: "NOT_FOUND",
  });
};

