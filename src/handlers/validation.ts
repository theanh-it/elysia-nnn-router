import { z } from "zod";
import type { RouteSchema } from "../types";

/**
 * Create validation handler from Zod schema
 * This middleware validates request data and returns detailed error messages
 */
export const createValidationHandler = (schema?: RouteSchema) => {
  if (!schema) return undefined;

  return async (context: any) => {
    try {
      // Validate body
      if (schema.body && context.body) {
        context.body = await schema.body.parseAsync(context.body);
      }

      // Validate query
      if (schema.query && context.query) {
        context.query = await schema.query.parseAsync(context.query);
      }

      // Validate params
      if (schema.params && context.params) {
        context.params = await schema.params.parseAsync(context.params);
      }

      // Validate headers
      if (schema.headers && context.headers) {
        context.headers = await schema.headers.parseAsync(context.headers);
      }
    } catch (error: unknown) {
      console.log(error);
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce(
          (result: any, { path = [], message = "" }) => {
            const key = path.join(".");
            result[key] = message;
            return result;
          },
          {}
        );

        return context.error(422, {
          success: false,
          message: "Validation error",
          errors,
        });
      }
      throw error;
    }
  };
};
