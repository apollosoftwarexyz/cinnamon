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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadUnless = exports.LoadIf = exports.Middleware = exports.Route = exports.Controller = exports.Method = exports.WebServerModuleState = void 0;
const cinnamon_internals_1 = require("@apollosoftwarexyz/cinnamon-internals");
const cinnamon_module_1 = require("../../sdk/cinnamon-module");
const logger_1 = require("../logger");
const Koa = require("koa");
const loader_1 = require("./loader");
__exportStar(require("./plugin"), exports);
/**
 * @internal
 * @private
 */
var WebServerModuleState;
(function (WebServerModuleState) {
    WebServerModuleState[WebServerModuleState["INITIAL"] = 0] = "INITIAL";
    WebServerModuleState[WebServerModuleState["READY"] = 1] = "READY";
    WebServerModuleState[WebServerModuleState["ONLINE"] = 2] = "ONLINE";
    WebServerModuleState[WebServerModuleState["ERRORED"] = 3] = "ERRORED";
})(WebServerModuleState = exports.WebServerModuleState || (exports.WebServerModuleState = {}));
var Method_1 = require("./api/Method");
Object.defineProperty(exports, "Method", { enumerable: true, get: function () { return Method_1.Method; } });
var Controller_1 = require("./api/Controller");
Object.defineProperty(exports, "Controller", { enumerable: true, get: function () { return Controller_1.default; } });
var Route_1 = require("./api/Route");
Object.defineProperty(exports, "Route", { enumerable: true, get: function () { return Route_1.default; } });
var Middleware_1 = require("./api/Middleware");
Object.defineProperty(exports, "Middleware", { enumerable: true, get: function () { return Middleware_1.default; } });
var introspection_1 = require("./introspection");
Object.defineProperty(exports, "LoadIf", { enumerable: true, get: function () { return introspection_1.LoadIf; } });
Object.defineProperty(exports, "LoadUnless", { enumerable: true, get: function () { return introspection_1.LoadUnless; } });
__exportStar(require("./middlewares"), exports);
/**
 * @category Core Modules
 * @CoreModule
 * @internal
 * @private
 */
class WebServerModule extends cinnamon_module_1.CinnamonModule {
    controllersPath;
    controllersLoader;
    currentState;
    enableLogging;
    /**
     * Returns the Koa application instance. Useful for registering Middleware, etc.
     */
    server;
    _underlyingServer;
    /**
     * Returns the underlying Node HTTP server instance used internally by Koa.
     */
    get underlyingServer() { return this._underlyingServer; }
    activeConnections;
    /**
     * @CoreModule
     * Initializes a Cinnamon Web Server.
     *
     * @param framework The Cinnamon Framework instance.
     * @param controllersPath The path to the controllers' directory.
     * @param trustProxies Whether proxy servers should be trusted
     *                     (as passed from Cinnamon's config file).
     * @private
     */
    constructor(framework, controllersPath, trustProxies) {
        super(framework);
        this.controllersPath = controllersPath;
        this.server = new Koa();
        this._underlyingServer = undefined;
        this.activeConnections = {};
        this.currentState = WebServerModuleState.INITIAL;
        this.enableLogging = false;
        this.controllersLoader = new loader_1.default({
            framework,
            owner: this,
            server: this.server,
            controllersPath: this.controllersPath
        });
        if (trustProxies) {
            this.server.proxy = trustProxies;
        }
    }
    /**
     * The current framework instance's logger.
     */
    get logger() { return this.framework.getModule(logger_1.default.prototype); }
    /**
     * Whether logging is enabled on the web server.
     */
    get isLoggingEnabled() { return this.enableLogging; }
    /**
     * Initializes the router with the controllers' path that was passed to the constructor.
     * This involves:
     * - scanning the directory for all the controller files,
     * - scanning each controller file for the controller methods,
     * - registering the controller methods (optionally with hot reload if the framework is in dev mode)
     * @private
     */
    async initialize() {
        this.logger.frameworkDebug("WebServer module is loading route controllers now.");
        // Ensure the controllers' directory is present.
        // We do this check in core startup, but this will ensure we're in the correct state
        // even if this module is loaded independently of the default distribution's core class.
        if (!await cinnamon_internals_1.default.fs.directoryExists(this.controllersPath)) {
            this.logger.error(`Unable to load web server controllers due to missing controllers directory: ${cinnamon_internals_1.default.fs.toAbsolutePath(this.controllersPath)}`);
            await this.framework.terminate(true);
            return;
        }
        const trackingControllersCount = await this.controllersLoader.scanForControllers();
        this.logger.info(`Found ${trackingControllersCount} controller${trackingControllersCount !== 1 ? 's' : ''}.`, 'webserver');
        await this.controllersLoader.registerControllers();
        this.logger.frameworkDebug("The internal web server is ready to be started.");
        this.currentState = WebServerModuleState.READY;
    }
    async start(options) {
        // If we're in development mode, we'll also register file watchers.
        if (this.framework.inDevMode) {
            await this.controllersLoader.registerWatchers();
        }
        // If enable_logging is set (i.e., not null) and different to this.enableLogging
        // (the instance variable), then update the instance variable.
        if (this.enableLogging !== (options.enable_logging ?? false)) {
            this.enableLogging = options.enable_logging ?? false;
        }
        if (this.currentState != WebServerModuleState.READY) {
            let reason = "because it is in an invalid state.";
            if (this.currentState === WebServerModuleState.ONLINE)
                reason = "because it is already running.";
            throw new Error(`The web server cannot be started ${reason}`);
        }
        return new Promise((resolve, _reject) => {
            const reject = (reason) => {
                this.currentState = WebServerModuleState.ERRORED;
                _reject(reason);
            };
            try {
                this._underlyingServer = this.server.listen(options.port, options.host, async () => {
                    if (this._underlyingServer == null)
                        return reject("Failed to start web server!");
                    this.logger.info(`Listening for web requests on: http://${options.host}:${options.port}/`);
                    // Credit: https://github.com/isaacs/server-destroy/blob/master/index.js
                    this._underlyingServer?.on('connection', (connection) => {
                        const key = `${connection.remoteAddress}:${connection.remotePort}`;
                        this.activeConnections[key] = connection;
                        connection.on('close', () => delete this.activeConnections[key]);
                    });
                    this.currentState = WebServerModuleState.READY;
                    // Trigger the 'afterStart' plugin hook for all plugins and wait for it to complete.
                    // This is for any plugins that need to hook into the web server module once it's
                    // started and waiting for requests (e.g., to hook into the underlying node http
                    // server).
                    // Once this is finished, we can consider Cinnamon fully started.
                    await this.framework.triggerPluginHook('afterStart');
                    return resolve();
                });
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    async terminate() {
        return new Promise(async (resolve, reject) => {
            try {
                await this.controllersLoader.unregisterWatchers();
                if (this._underlyingServer?.listening) {
                    this._underlyingServer?.close((err) => {
                        if (err)
                            return reject(err);
                        for (const key in this.activeConnections)
                            this.activeConnections[key].destroy();
                        this.currentState = WebServerModuleState.INITIAL;
                        return resolve();
                    });
                }
                else
                    return resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
}
exports.default = WebServerModule;
