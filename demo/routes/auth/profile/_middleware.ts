// Auth middleware - demonstrates directory-level middleware
export default async ({ headers, error }: any) => {
  const token = headers.authorization?.replace("Bearer ", "");

  // Mock token validation
  if (!token) {
    return error(401, {
      success: false,
      message: "Unauthorized - Token required",
      hint: 'Add header: Authorization: Bearer demo-token',
    });
  }

  if (token !== "demo-token") {
    return error(401, {
      success: false,
      message: "Unauthorized - Invalid token",
      hint: "Use token: demo-token",
    });
  }

  console.log("✅ Auth middleware passed");
};

