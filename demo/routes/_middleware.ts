// Global middleware - runs for all routes
export default (context: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${context.request.method} ${context.path}`);
};

