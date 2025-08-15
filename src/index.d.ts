import { Elysia } from "elysia";

export type NnnRouterPluginOptions = {
  dir?: string;
  prefix?: string;
};

export declare const nnnRouterPlugin: (
  options?: NnnRouterPluginOptions
) => Elysia;
