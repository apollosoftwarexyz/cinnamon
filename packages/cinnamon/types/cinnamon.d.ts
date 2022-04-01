import { EntityManager } from "@mikro-orm/core/EntityManager";
import * as Koa from "koa";
import { Files } from "formidable";

// Re-export Cinnamon from distribution directory.
export * from "../dist";
export { default } from "../dist";

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
