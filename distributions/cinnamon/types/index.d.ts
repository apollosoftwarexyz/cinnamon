/// <reference types="@mikro-orm/core" />
/// <reference types="koa" />
/// <reference types="koa-body" />
/// <reference types="chalk" />

import { EntityManager } from "@mikro-orm/core/EntityManager";
import * as Koa from "koa";
import { Files } from "formidable";

// Re-export Cinnamon.
export * from "./index.cjs";
export { default } from "./index.cjs";

/* Koa type augmentation */
declare module "koa" {
  interface Context {
    getEntityManager: () => EntityManager | undefined;
  }

  interface Request extends Koa.BaseRequest {
    body?: any;
    files?: Files;
  }
}
