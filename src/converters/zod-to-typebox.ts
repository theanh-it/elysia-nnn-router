import { Type, type TSchema } from "@sinclair/typebox";
import type { ZodTypeAny } from "zod";

/**
 * Convert Zod schemas to TypeBox schemas for Elysia Swagger
 * This allows Swagger UI to display proper request/response documentation
 * while keeping Zod validation in middleware
 */
export const zodToTypeBox = (zodSchema: ZodTypeAny): TSchema | undefined => {
  try {
    const def = (zodSchema as any)._def;
    const typeName = def.typeName;

    switch (typeName) {
      case "ZodObject": {
        const shape = def.shape();
        const properties: Record<string, TSchema> = {};
        const required: string[] = [];

        for (const [key, value] of Object.entries(shape)) {
          const converted = zodToTypeBox(value as ZodTypeAny);
          if (converted) {
            properties[key] = converted;
            if (!(value as any).isOptional()) {
              required.push(key);
            }
          }
        }

        return Type.Object(properties, {
          ...(required.length > 0 &&
          required.length < Object.keys(properties).length
            ? { required }
            : {}),
        });
      }

      case "ZodString": {
        const checks = def.checks || [];
        const options: any = {};

        for (const check of checks) {
          if (check.kind === "email") {
            options.format = "email";
          } else if (check.kind === "url") {
            options.format = "uri";
          } else if (check.kind === "uuid") {
            options.format = "uuid";
          } else if (check.kind === "datetime") {
            options.format = "date-time";
          } else if (check.kind === "min") {
            options.minLength = check.value;
          } else if (check.kind === "max") {
            options.maxLength = check.value;
          } else if (check.kind === "length") {
            options.minLength = check.value;
            options.maxLength = check.value;
          } else if (check.kind === "regex") {
            options.pattern = check.regex.source;
          }
        }

        return Type.String(options);
      }

      case "ZodNumber": {
        const checks = def.checks || [];
        let options: any = {};

        for (const check of checks) {
          if (check.kind === "min") {
            options.minimum = check.inclusive ? check.value : check.value + 1;
          } else if (check.kind === "max") {
            options.maximum = check.inclusive ? check.value : check.value - 1;
          } else if (check.kind === "int") {
            options.type = "integer";
          } else if (check.kind === "multipleOf") {
            options.multipleOf = check.value;
          }
        }

        return options.type === "integer"
          ? Type.Integer(options)
          : Type.Number(options);
      }

      case "ZodBoolean":
        return Type.Boolean();

      case "ZodArray": {
        const items = zodToTypeBox(def.type);
        if (!items) return undefined;

        const options: any = {};

        // Check for array constraints
        if (def.minLength) {
          options.minItems = def.minLength.value;
        }
        if (def.maxLength) {
          options.maxItems = def.maxLength.value;
        }
        if (def.exactLength) {
          options.minItems = def.exactLength.value;
          options.maxItems = def.exactLength.value;
        }

        return Type.Array(items, options);
      }

      case "ZodEnum":
        return Type.Union(def.values.map((v: string) => Type.Literal(v)));

      case "ZodOptional": {
        const inner = zodToTypeBox(def.innerType);
        return inner ? Type.Optional(inner) : undefined;
      }

      case "ZodNullable": {
        const inner = zodToTypeBox(def.innerType);
        return inner ? Type.Union([inner, Type.Null()]) : undefined;
      }

      case "ZodDefault": {
        const inner = zodToTypeBox(def.innerType);
        if (inner) {
          (inner as any).default = def.defaultValue();
        }
        return inner;
      }

      case "ZodLiteral":
        return Type.Literal(def.value);

      case "ZodUnion": {
        const options = def.options
          .map((opt: ZodTypeAny) => zodToTypeBox(opt))
          .filter(Boolean);
        return options.length > 0 ? Type.Union(options) : undefined;
      }

      case "ZodAny":
        // For file uploads - TypeBox will recognize this as File in multipart/form-data
        return Type.Any({ format: "binary" });

      case "ZodRecord": {
        const valueType = zodToTypeBox(def.valueType);
        return valueType
          ? Type.Record(Type.String(), valueType)
          : Type.Object({});
      }

      case "ZodDate":
        return Type.String({ format: "date-time" });

      case "ZodBigInt":
        return Type.Integer();

      case "ZodNull":
        return Type.Null();

      case "ZodUndefined":
        return Type.Undefined();

      case "ZodTuple": {
        const items = def.items
          .map((item: ZodTypeAny) => zodToTypeBox(item))
          .filter(Boolean);
        return items.length > 0 ? Type.Tuple(items) : undefined;
      }

      case "ZodIntersection": {
        const left = zodToTypeBox(def.left);
        const right = zodToTypeBox(def.right);
        return left && right ? Type.Intersect([left, right]) : undefined;
      }

      case "ZodDiscriminatedUnion": {
        const options = Array.from(def.options.values())
          .map((opt: any) => zodToTypeBox(opt as ZodTypeAny))
          .filter((opt): opt is TSchema => opt !== undefined);
        return options.length > 0 ? Type.Union(options) : undefined;
      }

      case "ZodNativeEnum": {
        const values = Object.values(def.values);
        return Type.Union(
          values.map((v: any) => Type.Literal(v as string | number | boolean))
        );
      }

      case "ZodEffects": {
        // For transforms, refinements, and preprocessing, return the underlying type
        return zodToTypeBox(def.schema);
      }

      case "ZodLazy": {
        // For recursive types, try to get the schema
        try {
          const schema = def.getter();
          return zodToTypeBox(schema);
        } catch {
          return Type.Any();
        }
      }

      case "ZodPipeline": {
        // For pipelines, return the output type
        return zodToTypeBox(def.out);
      }

      case "ZodCatch": {
        // Return the inner type
        return zodToTypeBox(def.innerType);
      }

      case "ZodBranded": {
        // Return the unwrapped type
        return zodToTypeBox(def.type);
      }

      case "ZodReadonly": {
        // Return the inner type
        return zodToTypeBox(def.innerType);
      }

      default:
        // Fallback to string for unsupported types
        console.warn(`Unsupported Zod type: ${typeName}`);
        return Type.String();
    }
  } catch (error) {
    console.warn("Failed to convert Zod schema to TypeBox:", error);
    return undefined;
  }
};
