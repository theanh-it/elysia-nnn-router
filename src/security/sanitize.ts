/**
 * Input sanitization to prevent XSS attacks
 */

/**
 * Sanitize string - remove HTML tags and dangerous characters
 */
export const sanitizeString = (str: string): string => {
  if (typeof str !== "string") return str;

  return str
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers (onclick, onload, etc.)
    .trim();
};

/**
 * Recursively sanitize object
 */
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = sanitizeString(key);
      // Sanitize value recursively
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Create sanitization middleware
 */
export const createSanitizeMiddleware = () => {
  return async (context: any) => {
    // Sanitize body
    if (context.body && typeof context.body === "object") {
      context.body = sanitizeObject(context.body);
    }

    // Sanitize query
    if (context.query && typeof context.query === "object") {
      context.query = sanitizeObject(context.query);
    }

    // Sanitize params
    if (context.params && typeof context.params === "object") {
      context.params = sanitizeObject(context.params);
    }
  };
};
