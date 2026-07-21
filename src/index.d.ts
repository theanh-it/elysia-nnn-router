import { Elysia, t, type Static } from "elysia";

export { t };
export type { Static };

export type NnnRouterPluginOptions = {
  dir?: string;
  prefix?: string;
  silent?: boolean;
  verbose?: boolean;
  onError?: (error: Error, filePath: string) => void;
};

export type RouteSchema = {
  params?: any;
  body?: any;
  query?: any;
  headers?: any;
  response?: Record<number, any>;
};

export type RouteDetail = {
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  operationId?: string;
  security?: Record<string, string[]>[];
};

export declare const nnnRouterPlugin: (
  options?: NnnRouterPluginOptions
) => Elysia;
