// GET /status với custom status code
export default ({ set }) => {
  set.status = 201;
  return {
    status: "ok",
    message: "Status endpoint with custom status code",
  };
};

