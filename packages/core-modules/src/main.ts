import Cinnamon from "@apollosoftwarexyz/cinnamon-core";
import { Logger as LoggerModule } from "@apollosoftwarexyz/cinnamon-logger";

export let Logger: LoggerModule;

export function initializeCoreModules() {
    Logger = Cinnamon.defaultInstance!.getModule<LoggerModule>(LoggerModule.prototype);
}
