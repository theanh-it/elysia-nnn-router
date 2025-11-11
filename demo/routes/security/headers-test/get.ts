import { z } from "zod";

export const schema = {
  response: {
    200: z.object({
      message: z.string(),
      securityHeaders: z.record(z.string(), z.string()),
    }),
  },
  detail: {
    summary: "Test security headers",
    description:
      "This endpoint demonstrates security headers (Helmet-like).\n\n" +
      "**Headers set:**\n" +
      "- `Content-Security-Policy`: Prevent XSS attacks\n" +
      "- `X-XSS-Protection`: Enable browser XSS filter\n" +
      "- `X-Content-Type-Options`: Prevent MIME sniffing\n" +
      "- `X-Frame-Options`: Prevent clickjacking\n" +
      "- `Strict-Transport-Security`: Force HTTPS\n" +
      "- `Referrer-Policy`: Control referrer info\n" +
      "- `Permissions-Policy`: Control browser features\n\n" +
      "Open DevTools → Network tab to see all headers!",
    tags: ["Security"],
  },
};

export default async ({ set }: any) => {
  const securityHeaders: Record<string, string> = {};

  const headerNames = [
    "Content-Security-Policy",
    "X-XSS-Protection",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Strict-Transport-Security",
    "Referrer-Policy",
    "Permissions-Policy",
  ];

  for (const name of headerNames) {
    if (set.headers?.[name]) {
      securityHeaders[name] = set.headers[name];
    }
  }

  return {
    message: "Security headers are set! Open DevTools to see them.",
    securityHeaders,
  };
};
