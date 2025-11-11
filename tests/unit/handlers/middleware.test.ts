import { describe, it, expect } from "bun:test";
import { createBeforeHandle } from "../../../src/handlers/middleware";

describe("createBeforeHandle", () => {
  it("should return common middlewares when no method middleware", () => {
    const commonMiddlewares = [
      async () => console.log("common1"),
      async () => console.log("common2"),
    ];
    
    const result = createBeforeHandle(commonMiddlewares);
    
    expect(result).toBe(commonMiddlewares);
    expect(result.length).toBe(2);
  });

  it("should return method middlewares when no common middlewares", () => {
    const methodMiddlewares = [
      async () => console.log("method1"),
    ];
    
    const result = createBeforeHandle([], methodMiddlewares);
    
    expect(result).toEqual(methodMiddlewares);
    expect(result.length).toBe(1);
  });

  it("should merge common and method middlewares", () => {
    const commonMiddlewares = [
      async () => console.log("common"),
    ];
    const methodMiddlewares = [
      async () => console.log("method"),
    ];
    
    const result = createBeforeHandle(commonMiddlewares, methodMiddlewares);
    
    expect(result.length).toBe(2);
    expect(result[0]).toBe(commonMiddlewares[0]);
    expect(result[1]).toBe(methodMiddlewares[0]);
  });

  it("should handle single method middleware (not array)", () => {
    const commonMiddlewares = [
      async () => console.log("common"),
    ];
    const methodMiddleware = async () => console.log("method");
    
    const result = createBeforeHandle(commonMiddlewares, methodMiddleware);
    
    expect(result.length).toBe(2);
    expect(result[0]).toBe(commonMiddlewares[0]);
    expect(result[1]).toBe(methodMiddleware);
  });

  it("should return empty array when both are empty", () => {
    const result = createBeforeHandle([]);
    
    expect(result).toEqual([]);
  });

  it("should maintain middleware order", () => {
    const mw1 = async () => "mw1";
    const mw2 = async () => "mw2";
    const mw3 = async () => "mw3";
    const mw4 = async () => "mw4";
    
    const result = createBeforeHandle([mw1, mw2], [mw3, mw4]);
    
    expect(result.length).toBe(4);
    expect(result[0]).toBe(mw1);
    expect(result[1]).toBe(mw2);
    expect(result[2]).toBe(mw3);
    expect(result[3]).toBe(mw4);
  });

  it("should handle undefined method middlewares", () => {
    const commonMiddlewares = [async () => console.log("common")];
    
    const result = createBeforeHandle(commonMiddlewares, undefined);
    
    expect(result).toBe(commonMiddlewares);
  });

  it("should handle null method middlewares", () => {
    const commonMiddlewares = [async () => console.log("common")];
    
    const result = createBeforeHandle(commonMiddlewares, null as any);
    
    expect(result).toBe(commonMiddlewares);
  });
});

