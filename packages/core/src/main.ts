import * as fs from 'fs';
import { parse as parseToml } from 'toml';
import { promisify } from 'util';
import {directoryExists, fileExists, toAbsolutePath} from "./_utils/fs";
import {initializeCoreModules} from "@apollosoftwarexyz/cinnamon-core-modules";
import Logger from "@apollosoftwarexyz/cinnamon-logger";

import CinnamonModule from "./module";
export { CinnamonModule };

/**
 * The main class of the Cinnamon framework. To initialize the framework, you initialize
 * this class by calling {@link Cinnamon.initialize()}.
 *
 * This will, in turn, initialize all of Cinnamon's default module set.
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
     */
    static async initialize() : Promise<Cinnamon> {
        // Stat cinnamon.toml to make sure it exists.
        // This doubles as making sure the process is started in the project root.
        if (!await fileExists(('./cinnamon.toml'))) {
            console.error(`(!) cinnamon.toml not found in ${process.cwd()}`);
            console.error(`(!) Please make sure your current working directory is the project's root directory and that your project's cinnamon.toml exists.`);
            return process.exit(1);
        }

        // If the file exists, we're ready to load cinnamon.toml, and to process and validate the contents.
        console.log("Initializing Cinnamon...");
        const projectConfigFile = (await promisify(fs.readFile)('./cinnamon.toml', 'utf-8'));

        let projectConfig;
        try {
            // Save the project config into a JS object. Any missing properties will be set as
            // one of the defaults specified in the structure below. We use Object.assign to
            // copy anything from the TOML file (source parameter) into the in-memory object
            // (target parameter).
            projectConfig = Object.assign({
                framework: {
                    core: {
                        development_mode: false
                    },
                    app: {
                        name: 'cinnamon'
                    },
                    http: {
                        host: '0.0.0.0',
                        port: 5213
                    },
                    structure: {
                        controllers: 'src/controllers/',
                        models: 'src/models/'
                    }
                }
            }, parseToml(projectConfigFile));
        } catch(ex) {
            console.error(`(!) Failed to parse cinnamon.toml:`);
            console.error(`(!) ...parsing failed on line ${ex.line}, at column ${ex.column}: ${ex.message}`);
            return process.exit(2);
        }

        // Check NODE_ENV environment variable.
        let forceDevMode = false;
        if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === "development") {
            forceDevMode = true;
        }

        // Initialize the framework using the project configuration.
        const framework = new Cinnamon({
            devMode: forceDevMode ? forceDevMode : projectConfig.framework.core.development_mode,
            appName: projectConfig.framework.app.name
        });

        framework.registerModule(new Logger(framework, framework.devMode));
        framework.getModule<Logger>(Logger.prototype).info("Starting Cinnamon...");

        // Display a warning if the framework is running in development mode. This is helpful for
        // various reasons - if development mode was erroneously enabled in production, this may
        // indicate the cause for potential performance degradation on account of hot-reload tech,
        // etc., and could even help mitigate security risks due to ensuring development-only code
        // is not accidentally enabled on a production service.
        if (framework.devMode)
            framework.getModule<Logger>(Logger.prototype).warn("Application running in DEVELOPMENT mode.");

        // It's important that ORM is initialized before the web routes, wherever possible, to
        // ensure that full functionality is available and unexpected errors won't occur immediately
        // after startup.
        // TODO: Initialize ORM.

        // Initialize web service controllers.
        framework.getModule<Logger>(Logger.prototype).info("Initializing web service controllers...");
        const controllersPath = toAbsolutePath(projectConfig.framework.structure.controllers);
        if (!await directoryExists(controllersPath)) {
            framework.getModule<Logger>(Logger.prototype).error(`(!) The specified controllers path does not exist: ${projectConfig.framework.structure.controllers}`);
            framework.getModule<Logger>(Logger.prototype).error(`(!) Full resolved path: ${controllersPath}`);
            process.exit(3);
        }

        // If we're the default instance (i.e., if the instantiated framework variable is equal to
        // the value of Cinnamon.defaultInstance), we can go ahead and initialize the global core
        // modules fields with the modules registered with this instance.
        if (Cinnamon.defaultInstance == framework) initializeCoreModules();
        return framework;
    }

}