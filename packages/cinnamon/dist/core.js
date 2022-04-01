"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CINNAMON_CORE_DEBUG_MODE = exports.Logger = exports.Config = void 0;
const fs = __importStar(require("fs"));
const util_1 = require("util");
const toml_1 = require("toml");
const internals_1 = __importDefault(require("./internals"));
const web_server_1 = __importDefault(require("./modules/web-server"));
const config_1 = __importDefault(require("./modules/config"));
const logger_1 = __importDefault(require("./modules/logger"));
const cinnamon_module_1 = require("./sdk/cinnamon-module");
/**
 * Whether the underlying framework is in debug mode.
 * This needs to be turned off for releases.
 */
exports.CINNAMON_CORE_DEBUG_MODE = true;
/**
 * The main class of the Cinnamon framework. To initialize the framework, you initialize
 * this class by calling {@link Cinnamon.initialize}.
 *
 * This will, in turn, initialize all of Cinnamon's default module set.
 *
 * @category Core
 * @Core
 */
class Cinnamon {
    constructor(props) {
        var _a, _b;
        this.devMode = (_a = props.devMode) !== null && _a !== void 0 ? _a : false;
        this.appName = (_b = props.appName) !== null && _b !== void 0 ? _b : 'cinnamon';
        this.modules = [];
        this.plugins = {};
        // Populate the default instance of Cinnamon, if it does not already exist.
        if (!Cinnamon._defaultInstance)
            Cinnamon._defaultInstance = this;
    }
    /**
     * Gets the default instance of Cinnamon. This is ordinarily the only instance of Cinnamon
     * that would be running, however it may be desired that the framework run twice in the
     * same application, in which case this will be the first instance that was started.
     *
     * If no instance of Cinnamon has been initialized, this will be undefined.
     */
    static get defaultInstance() { return Cinnamon._defaultInstance; }
    ;
    get logger() {
        return this.getModule(logger_1.default.prototype);
    }
    get config() {
        return this.getModule(config_1.default.prototype);
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
    hasModule(moduleType) {
        try {
            return this.getModule(moduleType);
        }
        catch (ex) {
            return false;
        }
    }
    /**
     * Gets the module if it is registered in the framework based on its type.
     * If it is not registered, an exception is thrown.
     *
     * @param moduleType The module type (i.e. typeof MyModule)
     */
    getModule(moduleType) {
        const module = this.modules.find(module => (module.constructor.name === moduleType.constructor.name
            || (cinnamon_module_1.CinnamonOptionalCoreModuleStub.prototype.isPrototypeOf(moduleType) &&
                moduleType.__isStub &&
                module.constructor.name === moduleType.__stubIdentifier)));
        if (module != null)
            return module;
        else
            throw new Error("(!) Attempted to access unknown module: " + moduleType);
    }
    /**
     * Registers the specified module.
     * If it has already been registered in the framework, the old module reference
     * will be overwritten with the new one.
     *
     * @param module The module instance to register.
     */
    registerModule(module) {
        this.unregisterModule(module);
        this.modules.push(module);
    }
    /**
     * Unregisters the specified module.
     * If the module was not already registered in the framework, this method
     * is a no-op.
     *
     * @param module The module instance to unregister.
     */
    unregisterModule(module) {
        if (this.hasModule(module))
            this.modules.splice(this.modules.indexOf(module), 1);
    }
    /**
     * Checks if the specified plugin is registered in the framework based on
     * its plugin identifier (organization_name/plugin_name).
     * Naturally, if it is, returns true, otherwise returns false.
     *
     * @param pluginIdentifier The identifier of the plugin to check.
     */
    hasPlugin(pluginIdentifier) {
        return Object.keys(this.plugins).includes(pluginIdentifier);
    }
    /**
     * A canonical alias for {@link use}. Prefer {@link use} for brevity.
     *
     * @param plugin The plugin instance to register.
     * @see use
     */
    registerPlugin(plugin) {
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
    use(plugin) {
        this.plugins[plugin.identifier] = plugin;
    }
    /**
     * Unregisters the specified plugin.
     * If the plugin was not already registered in the framework, this method
     * is a no-op.
     *
     * @param pluginIdentifier The identifier of the plugin instance to unregister.
     */
    unregisterPlugin(pluginIdentifier) {
        if (this.hasPlugin(pluginIdentifier))
            delete this.plugins[pluginIdentifier];
    }
    /**
     * Trigger the named hook on all the plugins currently registered with
     * Cinnamon. e.g., triggerPluginHook('onInitialize') will call the
     * onInitialize hook on all plugins.
     *
     * @param hookName The name of the hook to trigger.
     */
    async triggerPluginHook(hookName) {
        await Promise.all(
        // Get all plugins
        Object.values(this.plugins)
            // Filter to those that have the function 'hookName' as a property.
            .filter((plugin) => hookName in plugin && typeof plugin[hookName] === 'function')
            // Then, map the plugin to the hook's promise by calling the 'hookName' function
            // on the plugin.
            .map((plugin) => {
            (plugin)[hookName]();
        }));
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
    static async initialize(options) {
        var _a, _b;
        let autostartServices = (_a = options === null || options === void 0 ? void 0 : options.autostartServices) !== null && _a !== void 0 ? _a : true;
        // Stat cinnamon.toml to make sure it exists.
        // This doubles as making sure the process is started in the project root.
        if (!await internals_1.default.fs.fileExists(('./cinnamon.toml'))) {
            console.error(`(!) cinnamon.toml not found in ${process.cwd()}`);
            console.error(`(!) Please make sure your current working directory is the project's root directory and that your project's cinnamon.toml exists.`);
            return process.exit(1);
        }
        // If the file exists, we're ready to load cinnamon.toml, and to process and validate the contents.
        console.log("Initializing Cinnamon...");
        const projectConfigFile = (await (0, util_1.promisify)(fs.readFile)('./cinnamon.toml', 'utf-8'));
        let projectConfig;
        try {
            // Save the project config into a JS object. Any missing properties will be set as
            // one of the defaults specified in the structure below. We use Object.assign to
            // copy anything from the TOML file (source parameter) into the in-memory object
            // (target parameter).
            projectConfig = internals_1.default.data.mergeObjectDeep({
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
            }, (0, toml_1.parse)(projectConfigFile));
        }
        catch (ex) {
            console.error(`(!) Failed to parse cinnamon.toml:`);
            console.error(`(!) ...parsing failed on line ${ex.line}, at column ${ex.column}: ${ex.message}`);
            return process.exit(1);
        }
        // If the NODE_ENV environment variable is set, override the value from
        // cinnamon.toml.
        if (process.env.NODE_ENV) {
            projectConfig.framework.core.development_mode = process.env.NODE_ENV.toLowerCase() === "development";
        }
        // Initialize the framework using the project configuration.
        const framework = new Cinnamon({
            devMode: projectConfig.framework.core.development_mode,
            appName: projectConfig.framework.app.name
        });
        framework.registerModule(new config_1.default(framework, projectConfig.app, options === null || options === void 0 ? void 0 : options.appConfigSchema));
        framework.registerModule(new logger_1.default(framework, framework.devMode, {
            showFrameworkDebugMessages: exports.CINNAMON_CORE_DEBUG_MODE,
            logDelegate: options === null || options === void 0 ? void 0 : options.loggerDelegate,
            silenced: (_b = options === null || options === void 0 ? void 0 : options.silenced) !== null && _b !== void 0 ? _b : false,
        }));
        // If we're the default instance (i.e., if the instantiated framework variable is equal to
        // the value of Cinnamon.defaultInstance), we can go ahead and initialize the global core
        // modules fields with the modules registered with this instance.
        if (Cinnamon.defaultInstance == framework) {
            exports.Config = framework.getModule(config_1.default.prototype);
            exports.Logger = framework.getModule(logger_1.default.prototype);
        }
        framework.getModule(logger_1.default.prototype).info("Starting Cinnamon...");
        // Call the load function if it was supplied to the initialize options.
        // We do this before calling onInitialize on all the plugins to allow the user to register
        // their Cinnamon plugins in the load method first.
        if (options === null || options === void 0 ? void 0 : options.load)
            await options.load(framework);
        // Now await the onInitialize method for all plugins to make sure they've successfully
        // initialized.
        await Promise.all(Object.entries(framework.plugins).map(async ([identifier, plugin]) => {
            framework.getModule(logger_1.default.prototype).info(`Loaded plugin ${identifier}!`);
            if (!(await plugin.onInitialize())) {
            }
        }));
        try {
            // It's important that ORM is initialized before the web routes, wherever possible, to
            // ensure that full functionality is available and unexpected errors won't occur immediately
            // after startup.
            // Initialize ORM.
            if (projectConfig.framework.database.enabled) {
                framework.getModule(logger_1.default.prototype).info("Initializing database and ORM models...");
                const modelsPath = internals_1.default.fs.toAbsolutePath(projectConfig.framework.structure.models);
                if (!await internals_1.default.fs.directoryExists(modelsPath)) {
                    framework.getModule(logger_1.default.prototype).error(`(!) The specified models path does not exist: ${projectConfig.framework.structure.models}`);
                    framework.getModule(logger_1.default.prototype).error(`(!) Full resolved path: ${modelsPath}`);
                    process.exit(2);
                }
                const Database = (require('@apollosoftwarexyz/cinnamon-database').default);
                framework.registerModule(new Database(framework, modelsPath));
                console.log(framework.getModule(Database.prototype));
                await framework.getModule(Database.prototype).initialize(projectConfig.framework.database);
                if (autostartServices) {
                    await framework.getModule(Database.prototype).connect();
                }
                console.log(framework.getModule(Database.prototype).isInitialized);
                framework.getModule(logger_1.default.prototype).info("Successfully initialized database ORM and models.");
            }
            // Initialize web service controllers.
            framework.getModule(logger_1.default.prototype).info("Initializing web service controllers...");
            const controllersPath = internals_1.default.fs.toAbsolutePath(projectConfig.framework.structure.controllers);
            if (!await internals_1.default.fs.directoryExists(controllersPath)) {
                framework.getModule(logger_1.default.prototype).error(`(!) The specified controllers path does not exist: ${projectConfig.framework.structure.controllers}`);
                framework.getModule(logger_1.default.prototype).error(`(!) Full resolved path: ${controllersPath}`);
                process.exit(2);
            }
            // Now, register and initialize the web server, and load the controllers.
            framework.registerModule(new web_server_1.default(framework, controllersPath, projectConfig.framework.http.trust_proxy));
            await framework.getModule(web_server_1.default.prototype).initialize();
            framework.getModule(logger_1.default.prototype).info("Successfully initialized web service controllers.");
            // Trigger 'onStart' for all plugins and wait for it to complete. This is essentially the
            // 'post-initialize' hook for the framework.
            // Once this is finished, we can consider Cinnamon fully initialized.
            await framework.triggerPluginHook('onStart');
            if (autostartServices)
                await framework.getModule(web_server_1.default.prototype).start(projectConfig.framework.http);
            // Display a warning if the framework is running in development mode. This is helpful for
            // various reasons - if development mode was erroneously enabled in production, this may
            // indicate the cause for potential performance degradation on account of hot-reload tech,
            // etc., and could even help mitigate security risks due to ensuring development-only code
            // is not accidentally enabled on a production service.
            if (framework.devMode)
                framework.getModule(logger_1.default.prototype).warn("Application running in DEVELOPMENT mode.");
            return framework;
        }
        catch (ex) {
            framework.getModule(logger_1.default.prototype).error("Failed to start Cinnamon. If you believe this is a framework error, please open an issue in the " +
                "Cinnamon project repository.\n" +
                "(Apollo Software only): please consider opening an issue with the Internal Projects team." +
                "\n" +
                "https://github.com/apollosoftwarexyz/cinnamon/issues/new\n");
            framework.getModule(logger_1.default.prototype).error(ex.message);
            console.error('');
            console.error(ex);
            console.error(ex.stack);
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
    async terminate(inErrorState = false, message, exitCode) {
        try {
            if (message)
                this.getModule(logger_1.default.prototype)[inErrorState ? 'error' : 'warn'](message);
            this.getModule(logger_1.default.prototype)[inErrorState ? 'error' : 'warn'](`Shutting down...`);
        }
        catch (ex) {
            console.error(message);
            console.error("Cinnamon is shutting down.\n" +
                "This has not been logged because the logger was inactive or returned an error.");
        }
        // Presently, we just terminate the pertinent modules, however once the module system
        // has been refactored, we'll terminate all the modules.
        try {
            this.modules.forEach(module => module.terminate(inErrorState));
        }
        catch (ex) {
            process.exit(3);
        }
        // Exit with a POSIX exit code of non-zero if error, or zero if no error (implied by
        // inErrorState = false).
        process.exit(exitCode !== null && exitCode !== void 0 ? exitCode : (inErrorState ? 1 : 0));
    }
}
exports.default = Cinnamon;
