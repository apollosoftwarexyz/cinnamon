import CinnamonModule from './module';
export { CinnamonModule };

import { default as ConfigModule } from "@apollosoftwarexyz/cinnamon-config";
import { default as LoggerModule } from "@apollosoftwarexyz/cinnamon-logger";

export let Config: ConfigModule;
export let Logger: LoggerModule;

export function initializeCoreModules(modules: {
    Config: ConfigModule,
    Logger: LoggerModule,
}) {
    Config = modules.Config;
    Logger = modules.Logger;
}
