import { EntityManager } from "@mikro-orm/core/EntityManager";

/* Koa type augmentation */
declare module "koa" {
    interface Context {
        getEntityManager(): EntityManager;
    }
}

export * from '../dist/index';
export { default } from '../dist/index';
