import { ValidationSchema } from '@apollosoftwarexyz/cinnamon-validator';
import ConfigModule from "./modules/config";
import LoggerModule, { DelegateLogFunction } from "./modules/logger";
import { CinnamonModule } from "./sdk/cinnamon-module";
import { CinnamonPlugin } from "./sdk/cinnamon-plugin";
/**
 * A convenience field for the default Cinnamon instance's ConfigModule.
 */
export declare let Config: ConfigModule;
/**
 * A convenience field for the default Cinnamon instance's LoggerModule.
 */
export declare let Logger: LoggerModule;
/**
 * Whether the underlying framework is in debug mode.
 * This needs to be turned off for releases.
 */
export declare const CINNAMON_CORE_DEBUG_MODE = true;
export declare type CinnamonInitializationOptions = {
    /**
     * An optional validation schema for the app configuration.
     */
    appConfigSchema?: ValidationSchema;
    /**
     * If set to false, prevents Cinnamon from auto-starting modules, such as the web server.
     * The default is true.
     */
    autostartServices?: boolean;
    /**
     * If defined, specifies a function to execute once Cinnamon has initialized,
     * but before it has booted.
     * This is useful for loading plugins and modules, etc., hence the name.
     */
    load?: (framework: Cinnamon) => Promise<void>;
    /**
     * If specified, this {@link DelegateLogFunction} is passed to the logger,
     * so that custom actions may be performed based on all, or even specific
     * kinds of, logged messages.
     */
    loggerDelegate?: DelegateLogFunction;
    /**
     * If set to true, Cinnamon will disable all logging output
     * using the Logger.
     */
    silenced?: boolean;
};
/**
 * The main class of the Cinnamon framework. To initialize the framework, you initialize
 * this class by calling {@link Cinnamon.initialize}.
 *
 * This will, in turn, initialize all of Cinnamon's default module set.
 *
 * @category Core
 * @Core
 */
export default class Cinnamon {
    /**
     * Gets the default instance of Cinnamon. This is ordinarily the only instance of Cinnamon
     * that would be running, however it may be desired that the framework run twice in the
     * same application, in which case this will be the first instance that was started.
     *
     * If no instance of Cinnamon has been initialized, this will be undefined.
     */
    static get defaultInstance(): Cinnamon | undefined;
    private static _defaultInstance?;
    private readonly devMode;
    readonly appName: string;
    private readonly modules;
    private readonly plugins;
    get logger(): LoggerModule;
    get config(): ConfigModule;
    constructor(props: {
        devMode?: boolean;
        appName?: string;
    });
    /**
     * Whether the framework is in application development mode.
     * When set to true, features such as hot-reload will be automatically enabled.
     *
     * You should set this to false for production applications as there may be a performance
     * or security penalty present when certain development features are active.
     */
    get inDevMode(): boolean;
    /**
     * Checks if the specified module is registered in the framework based on its type.
     * If it is, the module is returned, otherwise false is returned.
     *
     * @param moduleType The module type (i.e. typeof MyModule)
     */
    hasModule<T extends CinnamonModule>(moduleType: T): T | boolean;
    /**
     * Gets the module if it is registered in the framework based on its type.
     * If it is not registered, an exception is thrown.
     *
     * @param moduleType The module type (i.e. typeof MyModule)
     */
    getModule<T extends CinnamonModule>(moduleType: T): T;
    /**
     * Registers the specified module.
     * If it has already been registered in the framework, the old module reference
     * will be overwritten with the new one.
     *
     * @param module The module instance to register.
     */
    registerModule<T extends CinnamonModule>(module: T): void;
    /**
     * Unregisters the specified module.
     * If the module was not already registered in the framework, this method
     * is a no-op.
     *
     * @param module The module instance to unregister.
     */
    unregisterModule<T extends CinnamonModule>(module: T): void;
    /**
     * Checks if the specified plugin is registered in the framework based on
     * its plugin identifier (organization_name/plugin_name).
     * Naturally, if it is, returns true, otherwise returns false.
     *
     * @param pluginIdentifier The identifier of the plugin to check.
     */
    hasPlugin(pluginIdentifier: string): boolean;
    /**
     * A canonical alias for {@link use}. Prefer {@link use} for brevity.
     *
     * @param plugin The plugin instance to register.
     * @see use
     */
    registerPlugin(plugin: CinnamonPlugin): void;
    /**
     * Registers the specified plugin.
     * **Unlike with registerModule**, if it has already been registered in the
     * framework, this method will throw an error as there is more ambiguity
     * when comparing plugins.
     *
     * @param plugin The plugin instance to register.
     */
    use(plugin: CinnamonPlugin): void;
    /**
     * Unregisters the specified plugin.
     * If the plugin was not already registered in the framework, this method
     * is a no-op.
     *
     * @param pluginIdentifier The identifier of the plugin instance to unregister.
     */
    unregisterPlugin(pluginIdentifier: string): void;
    /**
     * Trigger the named hook on all the plugins currently registered with
     * Cinnamon. e.g., triggerPluginHook('onInitialize') will call the
     * onInitialize hook on all plugins.
     *
     * @param hookName The name of the hook to trigger.
     */
    triggerPluginHook(hookName: string): Promise<void>;
    /**
     * Starts the initialization process for the framework. If an error happens during
     * initialization it is considered fatal and, therefore, the framework will terminate
     * the process with a POSIX error code.
     *
     * @param options Options that will be passed to various core internal
     * framework modules as they're initialized.
     * @return {Cinnamon} frameworkInstance - The initialized Cinnamon framework
     * instance.
     */
    static initialize(options?: CinnamonInitializationOptions): Promise<Cinnamon>;
    /**
     * Attempts to shut down any applicable modules, and then terminates the application.
     * This should be used if an unrecoverable exception is encountered with inErrorState
     * set to true.
     *
     * If you're just shutting down the web server for normal reasons, e.g. to install
     * updates, per user request, use terminate with inErrorState set to false.
     *
     * @param inErrorState Whether the application had to shut down because of an error
     * (true) or not (false).
     * @param message The termination message (likely the reason for the termination.)
     * @param exitCode The POSIX exit code to terminate with.
     */
    terminate(inErrorState?: boolean, message?: string, exitCode?: number): Promise<never>;
}
