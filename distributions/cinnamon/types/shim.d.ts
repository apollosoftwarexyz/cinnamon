/// <reference types="@types/koa" />
/// <reference types="koa-body" />
/// <reference types="chalk" />

import * as Koa from "koa";
import { Files } from "formidable";

// Re-export Cinnamon.
export * from "./index.cjs";
export { default } from "./index.cjs";

/* Koa type augmentation */
declare module "koa" {
    interface Request extends Koa.BaseRequest {
        body?: any;
        files?: Files;
    }
}
