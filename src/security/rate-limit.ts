import type { RateLimitConfig } from "../types";

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: Required<Omit<RateLimitConfig, "enabled" | "keyGenerator">> &
    Pick<RateLimitConfig, "keyGenerator">;

  constructor(config: RateLimitConfig) {
    this.config = {
      max: config.max || 100,
      window: config.window || "1m",
      message: config.message || "Too many requests",
      skipSuccessful: config.skipSuccessful || false,
      keyGenerator: config.keyGenerator,
    };
  }

  private parseWindow(window: string): number {
    const match = window.match(/^(\d+)([smhd])$/);
    if (!match) return 60000; // Default 1 minute

    const [, value, unit] = match;
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };

    return parseInt(value) * multipliers[unit];
  }

  private getKey(request: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    // Default: use IP from headers or URL
    return (
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      new URL(request.url).hostname
    );
  }

  check(request: Request): { allowed: boolean; remaining: number } {
    const key = this.getKey(request);
    const now = Date.now();
    const windowMs = this.parseWindow(this.config.window);

    // Get requests for this key
    let requests = this.requests.get(key) || [];

    // Remove old requests outside window
    requests = requests.filter((time) => now - time < windowMs);

    // Check limit
    const allowed = requests.length < this.config.max;
    const remaining = Math.max(0, this.config.max - requests.length - 1);

    // Add current request if allowed
    if (allowed) {
      requests.push(now);
      this.requests.set(key, requests);
    }

    return { allowed, remaining };
  }

  createMiddleware() {
    return async (context: any) => {
      const result = this.check(context.request);

      if (!result.allowed) {
        context.set.status = 429;
        context.set.headers["Retry-After"] = String(
          Math.ceil(this.parseWindow(this.config.window) / 1000)
        );
        context.set.headers["X-RateLimit-Limit"] = String(this.config.max);
        context.set.headers["X-RateLimit-Remaining"] = "0";

        return {
          status: "error",
          message: this.config.message,
        };
      }

      // Set rate limit headers
      context.set.headers["X-RateLimit-Limit"] = String(this.config.max);
      context.set.headers["X-RateLimit-Remaining"] = String(result.remaining);
    };
  }
}
