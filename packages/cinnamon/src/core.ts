import * as fs from 'fs';
import { promisify } from 'util';
import { parse as parseToml } from 'toml';

import {
    CinnamonError,
    directoryExists,
    fileExists,
    mergeObjectDeep,
    toAbsolutePath, toLowerKebabCase,
} from '@apollosoftwarexyz/cinnamon-internals';

import WebServerModule from './modules/web-server';
import { ValidationSchema } from '@apollosoftwarexyz/cinnamon-validator';

import ConfigModule from './modules/config';
import LoggerModule, { DelegateLogFunction } from './modules/logger';
import { CinnamonPlugin } from './sdk/cinnamon-plugin';
import { CinnamonModuleRegistry, _CinnamonModuleRegistryImpl, CinnamonModuleRegistryAccess } from './modules';
import { CinnamonModule, CinnamonModuleBase } from './sdk/cinnamon-module';
import {
    _CinnamonHookRegistryImpl,
    AsyncCinnamonHook, AsyncCinnamonHooks,
    CinnamonHook,
    CinnamonHookRegistry,
    CinnamonHooks
} from './hooks';

import { DatabaseModuleStub } from './modules/_stubs/database';
import { MissingPackageError } from './sdk/base';

/**
 * A convenience field for the default Cinnamon instance's ConfigModule.
 */
export let Config: ConfigModule;

/**
 * A convenience field for the default Cinnamon instance's LoggerModule.
 */
export let Logger: LoggerModule;

/**
 * Whether the underlying framework is in debug mode.
 * This needs to be turned off for releases.
 */
export const CINNAMON_CORE_DEBUG_MODE = false;

export type CinnamonInitializationOptions = {

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
export default class Cinnamon implements CinnamonModuleRegistryAccess, CinnamonHookRegistry {

    /**
     * Gets the default instance of Cinnamon. This is ordinarily the only instance of Cinnamon
     * that would be running, however it may be desired that the framework run twice in the
     * same application, in which case this will be the first instance that was started.
     *
     * If no instance of Cinnamon has been initialized, this will be undefined.
     */
    public static get defaultInstance() {
        return Cinnamon._defaultInstance;
    }

    private static _defaultInstance?: Cinnamon;

    private readonly devMode: boolean;
    public readonly appName: string;

    private readonly modules: CinnamonModuleRegistry;
    private readonly plugins: {
        [key: string]: CinnamonPlugin
    };

    private readonly hooks: CinnamonHookRegistry;

    public get logger() {
        return this.getModule<LoggerModule>(LoggerModule.prototype);
    }

    public get config() {
        return this.getModule<ConfigModule>(ConfigModule.prototype);
    }

    private constructor(props: {
        devMode?: boolean;
        appName?: string;
    }) {
        this.devMode = props.devMode ?? false;
        this.appName = props.appName ?? 'cinnamon';

        this.modules = new _CinnamonModuleRegistryImpl();
        this.plugins = {};
        this.hooks = new _CinnamonHookRegistryImpl();

        // Populate the default instance of Cinnamon, if it does not already exist.
        if (!Cinnamon._defaultInstance) {
            Cinnamon._defaultInstance = this;
        }

        // Additionally, in debug mode register a global variable for the
        // default instance.
        if (CINNAMON_CORE_DEBUG_MODE || this.devMode) {
            global.cinnamonDebug?.register(this);
        }
    }

    /**
     * Whether the framework is in application development mode.
     * When set to true, features such as hot-reload will be automatically enabled.
     *
     * You should set this to false for production applications as there may be a performance
     * or security penalty present when certain development features are active.
     */
    get inDevMode() { return this.devMode; }

    /**
     * Checks if the specified plugin is registered in the framework based on
     * its plugin identifier (organization_name/plugin_name).
     * Naturally, if it is, returns true, otherwise returns false.
     *
     * @param pluginIdentifier The identifier of the plugin to check.
     */
    public hasPlugin(pluginIdentifier: string) : boolean {
        return Object.keys(this.plugins).includes(pluginIdentifier);
    }

    /**
     * A canonical alias for {@link use}. Prefer {@link use} for brevity.
     *
     * @param plugin The plugin instance to register.
     * @see use
     */
    public registerPlugin(plugin: CinnamonPlugin) : void {
        return this.use(plugin);
    }

    /**
     * Registers the specified plugin.
     * **Unlike with registerModule**, if it has already been registered in the
     * framework, this method will throw an error as there is more ambiguity
     * when comparing plugins.
     *
     * @param plugin The plugin instance to register.
     */
    public use(plugin: CinnamonPlugin) : void {
        // Automatically register all hooks in the plugin.
        for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(plugin))) {
            const hookName = method as keyof CinnamonHooks;
            const hook = plugin[hookName];
            if (typeof hook !== 'function') continue;
            if (!this.registeredHooks.has(hookName)) continue;

            this.hooks.useHook(hookName, hook.bind(plugin));
        }

        // Register the plugin.
        this.plugins[plugin.identifier] = plugin;
    }

    /**
     * Unregisters the specified plugin.
     * If the plugin was not already registered in the framework, this method
     * is a no-op.
     *
     * @param pluginIdentifier The identifier of the plugin instance to unregister.
     */
    public unregisterPlugin(pluginIdentifier: string) : void {
        if (this.hasPlugin(pluginIdentifier)) {
            // Automatically unregister all hooks in the plugin.
            for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(this.plugins[pluginIdentifier]))) {
                const hookName = method as keyof CinnamonHooks;
                const hook = this.plugins[pluginIdentifier][hookName];
                if (typeof hook !== 'function') continue;
                if (!this.registeredHooks.has(hookName)) continue;

                this.hooks.cancelHook(hookName, hook.bind(this.plugins[pluginIdentifier]));
            }

            // Unregister the plugin.
            delete this.plugins[pluginIdentifier];
        }
    }

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
    static async initialize(options?: CinnamonInitializationOptions) : Promise<Cinnamon> {
        let autostartServices: boolean = options?.autostartServices ?? true;

        // Stat cinnamon.toml to make sure it exists.
        // This doubles as making sure the process is started in the project root.
        if (!await fileExists(('./cinnamon.toml'))) {
            console.error(`(!) cinnamon.toml not found in ${process.cwd()}`);
            console.error(`(!) Please make sure your current working directory is the project's root directory and that your project's cinnamon.toml exists.`);
            return process.exit(1);
        }

        // If the file exists, we're ready to load cinnamon.toml, and to process and validate the contents.
        console.log('Initializing Cinnamon...');
        const projectConfigFile = (await promisify(fs.readFile)('./cinnamon.toml', 'utf-8'));

        let projectConfig: {
            framework: {
                core: {
                    development_mode: boolean;
                };

                app: {
                    name: string;
                };

                http: {
                    host: string;
                    port: number;
                    enable_logging: boolean;
                    trust_proxy: boolean;
                };

                database: {
                    enabled: boolean;
                } & any;

                structure: {
                    controllers: string;
                    models: string;
                };
            };

            app: any;
        };

        try {
            // Save the project config into a JS object. Any missing properties will be set as
            // one of the defaults specified in the structure below. We use Object.assign to
            // copy anything from the TOML file (source parameter) into the in-memory object
            // (target parameter).
            projectConfig = mergeObjectDeep({
                framework: {
                    core: {
                        development_mode: false
                    },
                    app: {
                        name: 'cinnamon'
                    },
                    http: {
                        host: '0.0.0.0',
                        port: 5213,
                        enable_logging: false,
                        trust_proxy: false,
                    },
                    database: {
                        enabled: false,
                    },
                    structure: {
                        controllers: 'src/controllers/',
                        models: 'src/models/'
                    }
                },
                app: {}
            }, parseToml(projectConfigFile));
        } catch(ex: any) {
            console.error(`(!) Failed to parse cinnamon.toml:`);
            console.error(`(!) ...parsing failed on line ${ex.line}, at column ${ex.column}: ${ex.message}`);
            return process.exit(1);
        }

        // If the NODE_ENV environment variable is set, override the value from
        // cinnamon.toml.
        if (process.env.NODE_ENV) {
            projectConfig.framework.core.development_mode = process.env.NODE_ENV.toLowerCase() === 'development';
        }

        // Initialize the framework using the project configuration.
        const framework = new Cinnamon({
            devMode: projectConfig.framework.core.development_mode,
            appName: projectConfig.framework.app.name
        });

        framework.registerModule(framework => LoggerModule.create(framework, framework.devMode, {
            showFrameworkDebugMessages: CINNAMON_CORE_DEBUG_MODE,
            logDelegate: options?.loggerDelegate,
            silenced: options?.silenced ?? false,
        }));

        framework.registerModule(framework => new ConfigModule(
            framework,
            projectConfig.app,
            options?.appConfigSchema
        ));

        // Initialize the config and logger modules.
        await framework.getModule<LoggerModule>(LoggerModule.prototype).initialize();
        await framework.getModule<ConfigModule>(ConfigModule.prototype).initialize();

        // If we're the default instance (i.e., if the instantiated framework variable is equal to
        // the value of Cinnamon.defaultInstance), we can go ahead and initialize the global core
        // modules fields with the modules registered with this instance.
        if (Cinnamon.defaultInstance == framework) {
            Config = framework.config;
            Logger = framework.logger;
        }

        framework.logger.info('Starting Cinnamon...');

        // Call the load function if it was supplied to the initialize options.
        // We do this before calling onInitialize on all the plugins to allow the user to register
        // their Cinnamon plugins in the load method first.
        if (options?.load) await options.load(framework);

        // Now await the onInitialize method for all plugins to make sure they've successfully
        // initialized.
        await Promise.all(Object.entries(framework.plugins).map(async ([identifier, plugin]) => {
            framework.logger.info(`Loaded plugin ${identifier}!`);
            await plugin.onInitialize();
        }));

        try {
            // It's important that ORM is initialized before the web routes, wherever possible, to
            // ensure that full functionality is available and unexpected errors won't occur immediately
            // after startup.

            // Initialize ORM.
            if (projectConfig.framework.database.enabled) {
                framework.logger.info('Initializing database and ORM models...');

                let DatabaseModule: typeof DatabaseModuleStub;
                try {
                    // The 'as any' on the import name is necessary to ensure
                    // TypeScript does not resolve the import at compile time.
                    // If it does, a cyclic dependency will be created between
                    // the database module and the core module for types, which
                    // will cause compilation issues.
                    DatabaseModule = (await import('@apollosoftwarexyz/cinnamon-database' as any)).default;
                } catch(ex) {
                    console.error(ex);
                    throw new MissingPackageError('Cinnamon Database Connector', '@apollosoftwarexyz/cinnamon-database');
                }

                const modelsPath = toAbsolutePath(projectConfig.framework.structure.models);
                if (!await directoryExists(modelsPath)) {
                    framework.logger.error(`(!) The specified models path does not exist: ${projectConfig.framework.structure.models}`);
                    framework.logger.error(`(!) Full resolved path: ${modelsPath}`);
                    process.exit(2);
                }

                framework.registerModule(framework => new DatabaseModule(framework, modelsPath, projectConfig.framework.database));
                await framework.getModule(DatabaseModule.prototype).initialize();
                if (autostartServices) {
                    await framework.getModule(DatabaseModule.prototype).connect(true);
                }
                framework.logger.info('Successfully initialized database ORM and models.');
            }

            // Initialize web service controllers.
            framework.logger.info('Initializing web service controllers...');

            const controllersPath = toAbsolutePath(projectConfig.framework.structure.controllers);
            if (!await directoryExists(controllersPath)) {
                framework.logger.error(`(!) The specified controllers path does not exist: ${projectConfig.framework.structure.controllers}`);
                framework.logger.error(`(!) Full resolved path: ${controllersPath}`);
                process.exit(2);
            }

            // Now, register and initialize the web server, and load the controllers.
            framework.registerModule(framework => new WebServerModule(framework, controllersPath, projectConfig.framework.http.trust_proxy));
            await framework.getModule<WebServerModule>(WebServerModule.prototype).initialize();
            framework.logger.info('Successfully initialized web service controllers.');

            // Trigger 'onStart' for all plugins and wait for it to complete. This is essentially the
            // 'post-initialize' hook for the framework.
            // Once this is finished, we can consider Cinnamon fully initialized.
            await framework.hooks.triggerAsyncHook('onStart');

            if (autostartServices) {
                await framework.getModule<WebServerModule>(WebServerModule.prototype).start(projectConfig.framework.http);

                // Trigger the 'afterStart' plugin hook for all plugins and wait for it to complete.
                // This is for any plugins that need to hook into the web server module once it's
                // started and waiting for requests (e.g., to hook into the underlying node http
                // server).
                // Once this is finished, we can consider Cinnamon fully started.
                await framework.hooks.triggerAsyncHook('afterStart');
            }

            // Display a warning if the framework is running in development mode. This is helpful for
            // various reasons - if development mode was erroneously enabled in production, this may
            // indicate the cause for potential performance degradation on account of hot-reload tech,
            // etc., and could even help mitigate security risks due to ensuring development-only code
            // is not accidentally enabled on a production service.
            if (framework.devMode)
                framework.logger.warn('Application running in DEVELOPMENT mode.');

            return framework;
        } catch(ex: any) {
            framework.logger.error(
                'Failed to start Cinnamon.\n' +
                'If you believe this is a framework error, please open an issue ' +
                'in the Cinnamon project repository.\n' +
                'https://github.com/apollosoftwarexyz/cinnamon/issues/new\n' +
                '(ASL only): please consider opening an issue with the Internal Projects team.\n'
            );
            framework.logger.error(ex.message);

            if (!(ex instanceof CinnamonError) || ex.showStack) {
                console.error('');
                console.error(ex.stack);
            }

            process.exit(1);
        }
    }

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
    async terminate(inErrorState: boolean = false, message?: string, exitCode?: number) : Promise<never> {
        if (CINNAMON_CORE_DEBUG_MODE || this.devMode) {
            global.cinnamonDebug?.unregister(this);
        }

        try {
            if (message) this.logger[inErrorState ? 'error' : 'warn'](message);
            this.logger[inErrorState ? 'error' : 'warn'](`Shutting down${inErrorState ? ' due to error' : ''}...`);
        } catch (ex) {
            console.error(message);
            console.error(
                'Cinnamon is shutting down.\n' +
                'This has not been logged because the logger was inactive or returned an error.'
            );
        }

        // Presently, we just terminate the pertinent modules, however once the module system
        // has been refactored, we'll terminate all the modules.
        try {
            await (this.modules as _CinnamonModuleRegistryImpl).terminateModules(inErrorState);
        } catch(ex) {
            process.exit(3);
        }

        // Exit with a POSIX exit code of non-zero if error, or zero if no error (implied by
        // inErrorState = false).
        process.exit(exitCode ?? (inErrorState ? 1 : 0));
    }

    /* ----------------------- CinnamonModuleRegistry ----------------------- */

    hasModule<T extends CinnamonModuleBase>(moduleType: T): boolean | T {
        return this.modules.hasModule(moduleType);
    }
    getModule<T extends CinnamonModuleBase>(moduleType: T): T {
        return this.modules.getModule(moduleType);
    }

    private registerModule<T extends CinnamonModuleBase>(createModule: (framework: Cinnamon) => T) : void {
        const hooks = this.hooks;

        let perModuleProxy: ProxyHandler<Cinnamon>['get'];

        /**
         * Creates a perModuleProxy bound to a specific module.
         * This is done once, so it is okay to initialize values here (BEFORE
         * returning the internal closure/proxy).
         */
        const createPerModuleProxy = (module: CinnamonModuleBase) => {
            const humanModuleName = toLowerKebabCase(module.constructor.name).replace(/-module$/, '');
            const moduleLogger = this.logger.fork(humanModuleName);

            return (_target: any, property: string, _receiver: any): any => {
                if (property === 'logger') return moduleLogger;
                return undefined;
            };
        };

        const moduleFramework = new Proxy(this, {
            get(target, property: string, receiver: any): any {
                // If the property is a hook trigger method, bind it to the
                // hooks object and return it.
                // This allows modules to trigger hooks.
                if (['triggerHook', 'triggerAsyncHook'].includes(property)) {
                    return hooks[property].bind(hooks);
                }

                const perModuleProxyResult = perModuleProxy?.call(this, target, property, receiver);
                if (perModuleProxyResult !== undefined) return perModuleProxyResult;

                return Reflect.get(target, property, receiver);
            }
        });

        const module = createModule(moduleFramework);
        // Proxy additional methods on the module to allow for per-module
        // functionality (e.g., automatically injecting a per-module logger).
        // The logger module does not extend CinnamonModule, so this is okay
        // to do.
        if (module instanceof CinnamonModule) {
            perModuleProxy = createPerModuleProxy(module);
        }
        return this.modules.registerModule(module);
    }

    /* ------------------------ CinnamonHookRegistry ------------------------ */

    get registeredHooks(): Set<CinnamonHook> {
        return this.hooks.registeredHooks;
    }

    registerHook<K extends CinnamonHook>(hook: K) {
        return this.hooks.registerHook(hook);
    }

    unregisterHook<K extends CinnamonHook>(hook: K) {
        return this.hooks.unregisterHook(hook);
    }

    useHook<K extends CinnamonHook>(hook: K, callback: CinnamonHooks[K]): void {
        return this.hooks.useHook(hook, callback);
    }

    cancelHook<K extends CinnamonHook>(hook: K, callback: CinnamonHooks[K]): void {
        return this.hooks.cancelHook(hook, callback);
    }

    triggerHook<K extends CinnamonHook>(_: K, ...__: Parameters<CinnamonHooks[K]>): void {
        throw new CinnamonError(
            'Only modules can trigger hooks.\n\n' +
            "You're seeing this error because you tried to trigger a hook from outside a module.\n" +
            'For example, from within a controller, middleware or plugin.\n\n' +
            '- If you are trying to trigger a hook from within a module, make sure you are using the\n' +
            '  correct instance of the Cinnamon framework (passed into the module).\n\n' +
            '- If you are trying to trigger a hook from outside a module, you should instead use\n' +
            '  an API from a module.\n\n',
            true
        );
    }

    triggerAsyncHook<K extends AsyncCinnamonHook>(_: K, ...__: Parameters<AsyncCinnamonHooks[K]>): Promise<void> {
        throw new CinnamonError(
            'Only modules can trigger hooks.\n\n' +
            "You're seeing this error because you tried to trigger a hook from outside a module.\n" +
            'For example, from within a controller, middleware or plugin.\n\n' +
            '- If you are trying to trigger a hook from within a module, make sure you are using the\n' +
            '  correct instance of the Cinnamon framework (passed into the module).\n\n' +
            '- If you are trying to trigger a hook from outside a module, you should instead use\n' +
            '  an API from a module.\n\n',
            true
        );
    }

}
