// GET /async-example - ví dụ về async handler
export default async () => {
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    message: "Async operation completed",
    timestamp: new Date().toISOString(),
  };
};

