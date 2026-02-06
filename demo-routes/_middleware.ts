// Root middleware - áp dụng cho tất cả routes
export default (context) => {
  // Thêm timestamp vào context
  context.requestTime = new Date().toISOString();

  // Log request
  console.log(
    `[${context.requestTime}] ${context.request.method} ${context.request.url}`
  );
};
