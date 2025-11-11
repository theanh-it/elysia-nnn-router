import { Elysia } from "elysia";
import type { ZodTypeAny } from "zod";

export type RouteSchema = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
  headers?: ZodTypeAny;
  response?: Record<number, ZodTypeAny>;
  detail?: {
    summary?: string;
    description?: string;
    tags?: string[];
    deprecated?: boolean;
    operationId?: string;
  };
};

export type SwaggerConfig = {
  enabled?: boolean;
  path?: string;
  documentation?: {
    info?: {
      title?: string;
      version?: string;
      description?: string;
    };
    tags?: Array<{
      name: string;
      description?: string;
    }>;
    servers?: Array<{
      url: string;
      description?: string;
    }>;
  };
  autoDarkMode?: boolean;
  exclude?: string[];
};

export type NnnRouterPluginOptions = {
  dir?: string;
  prefix?: string;
  swagger?: SwaggerConfig;
};

export declare const nnnRouterPlugin: (
  options?: NnnRouterPluginOptions
) => Elysia;
