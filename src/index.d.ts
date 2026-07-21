import { Elysia } from "elysia";

export type NnnRouterPluginOptions = {
  dir?: string;
  prefix?: string;
  silent?: boolean;
  verbose?: boolean;
  onError?: (error: Error, filePath: string) => void;
};

export declare const nnnRouterPlugin: (
  options?: NnnRouterPluginOptions
) => Elysia;
