import { default as _ConfigModule } from "@apollosoftwarexyz/cinnamon-config";
import { default as _LoggerModule } from "@apollosoftwarexyz/cinnamon-logger";

export { LogEntry, DelegateLogEntry, DelegateLogFunction } from '@apollosoftwarexyz/cinnamon-logger';

export let Config: _ConfigModule;
export let Logger: _LoggerModule;

export function initializeCoreModules(modules: {
    Config: _ConfigModule;
    Logger: _LoggerModule;
}) {
    Config = modules.Config;
    Logger = modules.Logger;
}
