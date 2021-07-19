import * as fs from 'fs';
import { parse as parseToml } from 'toml';
import { promisify } from 'util';
import { fileExists } from "./_utils/fs";
import CinnamonModule from "./module";
import {Logger} from "@apollosoftwarexyz/cinnamon-logger";

export { CinnamonModule };

/**
 * The main class of the Cinnamon framework. To initialize the framework, you initialize
 * this class by calling {@link Cinnamon.initialize()}.
 *
 * This will, in turn, initialize all of Cinnamon's default module set.
 */
export default class Cinnamon {

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
        console.log("Initializing Apollo Framework...");
        const projectConfigFile = (await promisify(fs.readFile)('./cinnamon.toml', 'utf-8'));

        let projectConfig;
        try {
            projectConfig = Object.assign(parseToml(projectConfigFile), {
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
                        controllers: 'controllers/',
                        models: 'models/'
                    }
                }
            });
        } catch(ex) {
            console.error(`(!) Failed to parse cinnamon.toml:`);
            console.error(`(!) ...parsing failed on line ${ex.line}, at column ${ex.column}: ${ex.message}`);
            return process.exit(2);
        }

        // Initialize the framework using the project configuration.
        const framework = new Cinnamon({
            devMode: projectConfig.framework.core.development_mode,
            appName: projectConfig.framework.app.name
        });

        framework.registerModule(new Logger(framework, framework.devMode));
        framework.getModule<Logger>(Logger.prototype).info("Hello, world!");

        return framework;
    }

}
