/**
 * CSRF Protection
 * Simple token-based CSRF protection for state-changing methods
 */

const CSRF_HEADER = "X-CSRF-Token";
const CSRF_COOKIE = "csrf-token";

/**
 * Generate CSRF token
 */
export const generateCsrfToken = (): string => {
  return crypto.randomUUID();
};

/**
 * Create CSRF protection middleware
 */
export const createCsrfMiddleware = () => {
  return async (context: any): Promise<void | Record<string, unknown>> => {
    const { request, set } = context;
    const method = request.method.toUpperCase();

    // Skip safe methods
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
      return;
    }

    // Get token from header or cookie
    const tokenFromHeader = request.headers.get(CSRF_HEADER);
    const cookies = request.headers.get("cookie") || "";
    const tokenFromCookie = cookies
      .split(";")
      .find((c: string) => c.trim().startsWith(`${CSRF_COOKIE}=`))
      ?.split("=")[1];

    // Verify token
    if (
      !tokenFromHeader ||
      !tokenFromCookie ||
      tokenFromHeader !== tokenFromCookie
    ) {
      set.status = 403;
      return {
        status: "error",
        message: "CSRF token validation failed",
      };
    }
  };
};

/**
 * Helper to set CSRF cookie
 */
export const setCsrfCookie = (set: any) => {
  const token = generateCsrfToken();
  set.cookie[CSRF_COOKIE] = {
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };
  return token;
};
