import Cinnamon from "@apollosoftwarexyz/cinnamon-core";
import { default as LoggerModule } from "@apollosoftwarexyz/cinnamon-logger";

export let Logger: LoggerModule;

export function initializeCoreModules() {
    Logger = Cinnamon.defaultInstance!.getModule<LoggerModule>(LoggerModule.prototype);
}
