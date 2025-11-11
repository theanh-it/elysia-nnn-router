import type { SecurityHeadersConfig } from "../types";

/**
 * Security headers middleware (Helmet-like)
 */
export const createSecurityHeadersMiddleware = (
  config: SecurityHeadersConfig
) => {
  const {
    contentSecurityPolicy = true,
    xssProtection = true,
    noSniff = true,
    frameGuard = "deny",
    hsts = true,
  } = config;

  return async (context: any) => {
    const { set } = context;

    // Content Security Policy
    if (contentSecurityPolicy) {
      if (
        typeof contentSecurityPolicy === "object" &&
        contentSecurityPolicy.directives
      ) {
        const directives = Object.entries(contentSecurityPolicy.directives)
          .filter(([, values]) => values !== undefined)
          .map(([key, values]) => `${key} ${values!.join(" ")}`)
          .join("; ");
        set.headers["Content-Security-Policy"] = directives;
      } else {
        // Default CSP
        set.headers["Content-Security-Policy"] =
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";
      }
    }

    // XSS Protection
    if (xssProtection) {
      set.headers["X-XSS-Protection"] = "1; mode=block";
    }

    // MIME Type Sniffing Protection
    if (noSniff) {
      set.headers["X-Content-Type-Options"] = "nosniff";
    }

    // Clickjacking Protection
    if (frameGuard) {
      const value = frameGuard === true ? "DENY" : frameGuard.toUpperCase();
      set.headers["X-Frame-Options"] = value;
    }

    // HTTP Strict Transport Security
    if (hsts) {
      if (typeof hsts === "object") {
        const maxAge = hsts.maxAge || 31536000; // 1 year default
        const includeSubDomains = hsts.includeSubDomains !== false;
        set.headers["Strict-Transport-Security"] = `max-age=${maxAge}${
          includeSubDomains ? "; includeSubDomains" : ""
        }`;
      } else {
        set.headers["Strict-Transport-Security"] =
          "max-age=31536000; includeSubDomains";
      }
    }

    // Additional security headers
    set.headers["X-Permitted-Cross-Domain-Policies"] = "none";
    set.headers["Referrer-Policy"] = "no-referrer";
    set.headers["Permissions-Policy"] =
      "geolocation=(), microphone=(), camera=()";
  };
};
