import { relative, sep } from "path";

/**
 * Convert file path to route path
 * Example: routes/users/[id]/get.ts -> /users/:id
 */
export const toRoutePath = (filePath: string, base: string): string => {
  const rel = relative(base, filePath).replace(/\.(ts|js)$/, "");

  return (
    "/" +
    rel
      .split(sep)
      .map((part) => {
        // Convert [param] to :param for dynamic routes
        if (part.startsWith("[") && part.endsWith("]")) {
          return `:${part.slice(1, -1)}`;
        }
        return part;
      })
      .filter(Boolean)
      .join("/")
  );
};
