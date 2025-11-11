import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { zodToTypeBox } from "../../../src/converters/zod-to-typebox";
import { Type } from "@sinclair/typebox";

describe("zodToTypeBox - Basic Types", () => {
  it("should convert ZodString", () => {
    const schema = z.string();
    const result = zodToTypeBox(schema);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe("string");
  });

  it("should convert ZodNumber", () => {
    const schema = z.number();
    const result = zodToTypeBox(schema);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe("number");
  });

  it("should convert ZodBoolean", () => {
    const schema = z.boolean();
    const result = zodToTypeBox(schema);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe("boolean");
  });

  it("should convert ZodNull", () => {
    const schema = z.null();
    const result = zodToTypeBox(schema);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe("null");
  });

  it("should convert ZodUndefined", () => {
    const schema = z.undefined();
    const result = zodToTypeBox(schema);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe("undefined");
  });

  it("should convert ZodDate to string with date-time format", () => {
    const schema = z.date();
    const result = zodToTypeBox(schema);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe("string");
    expect((result as any)?.format).toBe("date-time");
  });

  it("should convert ZodBigInt to integer", () => {
    const schema = z.bigint();
    const result = zodToTypeBox(schema);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe("integer");
  });
});

describe("zodToTypeBox - String Constraints", () => {
  it("should convert string.email()", () => {
    const schema = z.string().email();
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.format).toBe("email");
  });

  it("should convert string.url()", () => {
    const schema = z.string().url();
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.format).toBe("uri");
  });

  it("should convert string.uuid()", () => {
    const schema = z.string().uuid();
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.format).toBe("uuid");
  });

  it("should convert string.datetime()", () => {
    const schema = z.string().datetime();
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.format).toBe("date-time");
  });

  it("should convert string.min()", () => {
    const schema = z.string().min(5);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.minLength).toBe(5);
  });

  it("should convert string.max()", () => {
    const schema = z.string().max(100);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.maxLength).toBe(100);
  });

  it("should convert string.min().max() together", () => {
    const schema = z.string().min(5).max(100);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.minLength).toBe(5);
    expect(result?.maxLength).toBe(100);
  });

  it("should convert string.length()", () => {
    const schema = z.string().length(10);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.minLength).toBe(10);
    expect(result?.maxLength).toBe(10);
  });

  it("should convert string.regex()", () => {
    const schema = z.string().regex(/^\d+$/);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.pattern).toBe("^\\d+$");
  });

  it("should handle multiple string constraints", () => {
    const schema = z.string().email().min(5).max(100);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.format).toBe("email");
    expect(result?.minLength).toBe(5);
    expect(result?.maxLength).toBe(100);
  });
});

describe("zodToTypeBox - Number Constraints", () => {
  it("should convert number.min()", () => {
    const schema = z.number().min(0);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("number");
    expect(result?.minimum).toBe(0);
  });

  it("should convert number.max()", () => {
    const schema = z.number().max(100);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("number");
    expect(result?.maximum).toBe(100);
  });

  it("should convert number.int()", () => {
    const schema = z.number().int();
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("integer");
  });

  it("should convert number.multipleOf()", () => {
    const schema = z.number().multipleOf(5);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.multipleOf).toBe(5);
  });

  it("should handle multiple number constraints", () => {
    const schema = z.number().int().min(18).max(120);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("integer");
    expect(result?.minimum).toBe(18);
    expect(result?.maximum).toBe(120);
  });
});

describe("zodToTypeBox - Complex Types", () => {
  it("should convert ZodObject", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("object");
    expect(result?.properties).toBeDefined();
    expect(result?.properties?.name?.type).toBe("string");
    expect(result?.properties?.age?.type).toBe("number");
  });

  it("should handle required and optional fields", () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
    });
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.properties).toBeDefined();
    expect(result?.properties?.required).toBeDefined();
    expect(result?.properties?.optional).toBeDefined();
  });

  it("should convert ZodArray", () => {
    const schema = z.array(z.string());
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("array");
    expect(result?.items?.type).toBe("string");
  });

  it("should convert ZodArray with constraints", () => {
    const schema = z.array(z.string()).min(1).max(10);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("array");
    expect(result?.minItems).toBe(1);
    expect(result?.maxItems).toBe(10);
  });

  it("should convert ZodEnum", () => {
    const schema = z.enum(["user", "admin", "guest"]);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.anyOf).toBeDefined();
    expect(result?.anyOf?.length).toBe(3);
  });

  it("should convert ZodLiteral", () => {
    const schema = z.literal("exact value");
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.const).toBe("exact value");
  });

  it("should convert ZodUnion", () => {
    const schema = z.union([z.string(), z.number()]);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.anyOf).toBeDefined();
    expect(result?.anyOf?.length).toBe(2);
  });

  it("should convert ZodTuple", () => {
    const schema = z.tuple([z.string(), z.number()]);
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("array");
    expect(result?.items).toBeDefined();
    expect(Array.isArray(result?.items)).toBe(true);
    expect(result?.items?.length).toBe(2);
  });

  it("should convert ZodRecord", () => {
    const schema = z.record(z.string(), z.number());
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("object");
    expect(result?.patternProperties || result?.additionalProperties).toBeDefined();
  });
});

describe("zodToTypeBox - Wrapper Types", () => {
  it("should convert ZodOptional", () => {
    const schema = z.string().optional();
    const result = zodToTypeBox(schema) as any;
    
    expect(result).toBeDefined();
    // TypeBox Optional is handled at object level
  });

  it("should convert ZodNullable", () => {
    const schema = z.string().nullable();
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.anyOf).toBeDefined();
    expect(result?.anyOf?.some((item: any) => item.type === "null")).toBe(true);
  });

  it("should convert ZodDefault", () => {
    const schema = z.string().default("default value");
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("string");
    expect(result?.default).toBe("default value");
  });

  it("should convert ZodEffects (transform)", () => {
    const schema = z.string().transform((val) => val.toUpperCase());
    const result = zodToTypeBox(schema) as any;
    
    // Should return underlying type
    expect(result?.type).toBe("string");
  });

  it("should convert ZodBranded", () => {
    const schema = z.string().brand<"Email">();
    const result = zodToTypeBox(schema) as any;
    
    // Should return underlying type
    expect(result?.type).toBe("string");
  });
});

describe("zodToTypeBox - Edge Cases", () => {
  it("should handle nested objects", () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.properties?.user?.type).toBe("object");
    expect(result?.properties?.user?.properties?.name?.type).toBe("string");
    expect(result?.properties?.user?.properties?.email?.format).toBe("email");
  });

  it("should handle arrays of objects", () => {
    const schema = z.array(z.object({
      id: z.number(),
      name: z.string(),
    }));
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("array");
    expect(result?.items?.type).toBe("object");
    expect(result?.items?.properties?.id?.type).toBe("number");
  });

  it("should handle ZodAny", () => {
    const schema = z.any();
    const result = zodToTypeBox(schema) as any;
    
    expect(result).toBeDefined();
  });

  it("should return undefined for invalid schema", () => {
    const result = zodToTypeBox(null as any);
    
    expect(result).toBeUndefined();
  });

  it("should handle complex nested validation", () => {
    const schema = z.object({
      name: z.string().min(3).max(50),
      email: z.string().email(),
      age: z.number().int().min(18).max(120).optional(),
      role: z.enum(["user", "admin"]),
      tags: z.array(z.string()).min(1),
    });
    const result = zodToTypeBox(schema) as any;
    
    expect(result?.type).toBe("object");
    expect(result?.properties?.name?.minLength).toBe(3);
    expect(result?.properties?.name?.maxLength).toBe(50);
    expect(result?.properties?.email?.format).toBe("email");
    expect(result?.properties?.age?.type).toBe("integer");
    expect(result?.properties?.tags?.minItems).toBe(1);
  });
});

