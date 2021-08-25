import { default as LoggerModule } from "@apollosoftwarexyz/cinnamon-logger";

export let Logger: LoggerModule;

export function initializeCoreModules(modules: {
    Logger: LoggerModule
}) {
    Logger = modules.Logger;
}
