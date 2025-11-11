// Auth middleware - demonstrates directory-level middleware
// NOTE: This middleware applies to ALL routes in auth/* folder
// EXCEPT routes that have their own method-level middleware override

export default async ({ headers, error, path }: any) => {
  // Skip auth check for login endpoint
  if (path.includes("/login")) {
    console.log("✅ Skipping auth check for login endpoint");
    return;
  }

  const token = headers.authorization?.replace("Bearer ", "");

  // Mock token validation
  if (!token) {
    return error(401, {
      success: false,
      message: "Unauthorized - Token required",
      hint: "Add header: Authorization: Bearer demo-token",
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

