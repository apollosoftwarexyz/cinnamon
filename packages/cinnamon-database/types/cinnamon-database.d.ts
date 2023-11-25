import { EntityManager } from '@mikro-orm/core';

/* Cinnamon Context augmentation */
declare module '@apollosoftwarexyz/cinnamon' {
    interface Context {
        getEntityManager(): EntityManager;
    }
}

export * from '../dist/index';
export { default } from '../dist/index';
