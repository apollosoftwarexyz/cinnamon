import CinnamonModule from './module';
export { CinnamonModule };

import { default as _ConfigModule } from "@apollosoftwarexyz/cinnamon-config";
import { default as _LoggerModule } from "@apollosoftwarexyz/cinnamon-logger";
import { default as _DatabaseModule } from "@apollosoftwarexyz/cinnamon-database";

import {EntityManager} from "@mikro-orm/core";

export let Config: _ConfigModule;
export let Logger: _LoggerModule;
export let Database: EntityManager;
export let DatabaseModule: _DatabaseModule;

export function initializeCoreModules(modules: {
    Config: _ConfigModule;
    Logger: _LoggerModule;
    Database: _DatabaseModule;
}) {
    Config = modules.Config;
    Logger = modules.Logger;
    Database = modules.Database.entityManager;
    DatabaseModule = modules.Database;
}
