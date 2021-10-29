import * as fs from 'fs';
import { promisify } from 'util';
import { parse as parseToml } from 'toml';
import { initializeCoreModules, CinnamonModule } from "@apollosoftwarexyz/cinnamon-core-modules";
export { CinnamonModule };

import cinnamonInternals from "@apollosoftwarexyz/cinnamon-core-internals";
import Config from "@apollosoftwarexyz/cinnamon-config";
import Logger from "@apollosoftwarexyz/cinnamon-logger";
import Database, { CinnamonDatabaseConfiguration, ORMRequestContext } from "@apollosoftwarexyz/cinnamon-database";
import WebServer from "@apollosoftwarexyz/cinnamon-web-server";
import { ValidationSchema } from '@apollosoftwarexyz/cinnamon-validator';

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
     * If set to true, Cinnamon will disable all logging output
     * using the Logger.
     */
    silenced?: boolean;

    /**
     * If set to false, prevents Cinnamon from auto-starting modules, such as the web server.
     * The default is true.
     */
    autostart?: boolean;
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
    public static get defaultInstance() { return Cinnamon._defaultInstance; };
    private static _defaultInstance?: Cinnamon;

    private readonly devMode: boolean;
    public readonly appName: string;

    private readonly modules: CinnamonModule[];

    constructor(props: {
        devMode?: boolean;
        appName?: string;
    }) {
        this.devMode = props.devMode ?? false;
        this.appName = props.appName ?? 'cinnamon';

        this.modules = [];

        // Populate the default instance of Cinnamon, if it does not already exist.
        if (!Cinnamon._defaultInstance) Cinnamon._defaultInstance = this;
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
     * Checks if the specified module is registered in the framework based on its type.
     * If it is, the module is returned, otherwise false is returned.
     *
     * @param moduleType The module type (i.e. typeof MyModule)
     */
    public hasModule<T extends CinnamonModule>(moduleType: T) : T | boolean {
        try {
            return this.getModule<T>(moduleType);
        } catch(ex) {
            return false;
        }
    }

    /**
     * Gets the module if it is registered in the framework based on its type.
     * If it is not registered, an exception is thrown.
     *
     * @param moduleType The module type (i.e. typeof MyModule)
     */
    public getModule<T extends CinnamonModule>(moduleType: T) : T {
        const module = this.modules.find(module => module.constructor.name === moduleType.constructor.name) as T;
        if (module != null) return module;
        else throw new Error("(!) Attempted to access unknown module: " + moduleType);
    }

    /**
     * Registers the specified module.
     * If it has already been registered in the framework, the old module reference
     * will be overwritten with the new one.
     *
     * @param module The module instance to register.
     */
    public registerModule<T extends CinnamonModule>(module: T) {
        if (this.hasModule<T>(module))
            this.modules.splice(this.modules.indexOf(module), 1);

        this.modules.push(module);
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
        let autostart: boolean = options?.autostart ?? true;

        // Stat cinnamon.toml to make sure it exists.
        // This doubles as making sure the process is started in the project root.
        if (!await cinnamonInternals.fs.fileExists(('./cinnamon.toml'))) {
            console.error(`(!) cinnamon.toml not found in ${process.cwd()}`);
            console.error(`(!) Please make sure your current working directory is the project's root directory and that your project's cinnamon.toml exists.`);
            return process.exit(1);
        }

        // If the file exists, we're ready to load cinnamon.toml, and to process and validate the contents.
        console.log("Initializing Cinnamon...");
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
                };

                database: CinnamonDatabaseConfiguration;

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
            projectConfig = cinnamonInternals.data.mergeObjectDeep({
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
                        enable_logging: false
                    },
                    database: {
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
            return process.exit(2);
        }

        // Check NODE_ENV environment variable.
        let forceDevMode = false;
        if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === "development") {
            forceDevMode = true;
            // Patch to force development mode in the framework core config if
            // it was set by the environment variable.
            projectConfig.framework.core.development_mode = forceDevMode;
        }

        // Initialize the framework using the project configuration.
        const framework = new Cinnamon({
            devMode: forceDevMode ? forceDevMode : projectConfig.framework.core.development_mode,
            appName: projectConfig.framework.app.name
        });

        framework.registerModule(new Config(
            framework,
            projectConfig.app,
            options?.appConfigSchema
        ));
        framework.registerModule(new Logger(framework, framework.devMode, {
            showFrameworkDebugMessages: CINNAMON_CORE_DEBUG_MODE,
            silenced: options?.silenced ?? false
        }));
        framework.getModule<Logger>(Logger.prototype).info("Starting Cinnamon...");

        // Display a warning if the framework is running in development mode. This is helpful for
        // various reasons - if development mode was erroneously enabled in production, this may
        // indicate the cause for potential performance degradation on account of hot-reload tech,
        // etc., and could even help mitigate security risks due to ensuring development-only code
        // is not accidentally enabled on a production service.
        if (framework.devMode)
            framework.getModule<Logger>(Logger.prototype).warn("Application running in DEVELOPMENT mode.");

        try {
            // It's important that ORM is initialized before the web routes, wherever possible, to
            // ensure that full functionality is available and unexpected errors won't occur immediately
            // after startup.

            // Initialize ORM.
            framework.getModule<Logger>(Logger.prototype).info("Initializing database and ORM models...");

            const modelsPath = cinnamonInternals.fs.toAbsolutePath(projectConfig.framework.structure.models);
            if (!await cinnamonInternals.fs.directoryExists(modelsPath)) {
                framework.getModule<Logger>(Logger.prototype).error(`(!) The specified models path does not exist: ${projectConfig.framework.structure.models}`);
                framework.getModule<Logger>(Logger.prototype).error(`(!) Full resolved path: ${modelsPath}`);
                process.exit(3);
            }

            framework.registerModule(new Database(framework, modelsPath));
            await framework.getModule<Database>(Database.prototype).initialize(projectConfig.framework.database);
            framework.getModule<Logger>(Logger.prototype).info("Successfully initialized database ORM and models.");

            // Initialize web service controllers.
            framework.getModule<Logger>(Logger.prototype).info("Initializing web service controllers...");

            const controllersPath = cinnamonInternals.fs.toAbsolutePath(projectConfig.framework.structure.controllers);
            if (!await cinnamonInternals.fs.directoryExists(controllersPath)) {
                framework.getModule<Logger>(Logger.prototype).error(`(!) The specified controllers path does not exist: ${projectConfig.framework.structure.controllers}`);
                framework.getModule<Logger>(Logger.prototype).error(`(!) Full resolved path: ${controllersPath}`);
                process.exit(3);
            }

            framework.registerModule(new WebServer(framework, controllersPath));
            await framework.getModule<WebServer>(WebServer.prototype).initialize();
            framework.getModule<Logger>(Logger.prototype).info("Successfully initialized web service controllers.");

            // If we're the default instance (i.e., if the instantiated framework variable is equal to
            // the value of Cinnamon.defaultInstance), we can go ahead and initialize the global core
            // modules fields with the modules registered with this instance.
            if (Cinnamon.defaultInstance == framework) initializeCoreModules({
                Config: framework.getModule<Config>(Config.prototype),
                Logger: framework.getModule<Logger>(Logger.prototype),
                Database: framework.getModule<Database>(Database.prototype)
            });

            if (autostart)
                await framework.getModule<WebServer>(WebServer.prototype).start(projectConfig.framework.http);

            // If the database has been initialized, register the middleware with Koa to create a new request context
            // for each request.
            if (framework.getModule<Database>(Database.prototype).isInitialized) {
                framework.getModule<WebServer>(WebServer.prototype).server.use((ctx, next) => ORMRequestContext.createAsync(
                    framework.getModule<Database>(Database.prototype).em, next
                ));
            }

            return framework;
        } catch(ex: any) {
            framework.getModule<Logger>(Logger.prototype).error(
                "Failed to start Cinnamon. If you believe this is a framework error, please open an issue in the " +
                "Cinnamon project repository.\n" +
                "(Apollo Software only): please consider opening an issue with the Internal Projects team." +
                "\n" +
                "https://github.com/apollosoftwarexyz/cinnamon/issues/new\n"
            );
            framework.getModule<Logger>(Logger.prototype).error(ex.message);
            console.error('');
            console.error(ex);
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
     */
    async terminate(inErrorState: boolean = false) : Promise<void> {
        // Presently, we just terminate the WebServer module, however once a proper, fully-fledged,
        // module system is in place, we'll terminate all the modules.
        await this.getModule<WebServer>(WebServer.prototype).terminate();

        // Exit with a POSIX exit code of non-zero if error, or zero if no error (implied by
        // inErrorState = false).
        process.exit(inErrorState ? 1 : 0);
    }

}
