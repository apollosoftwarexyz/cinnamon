import Cinnamon  from "@apollosoftwarexyz/cinnamon-core";
import Logger from "@apollosoftwarexyz/cinnamon-logger";
import cinnamonInternals from "@apollosoftwarexyz/cinnamon-core-internals";
import { CinnamonModule } from "@apollosoftwarexyz/cinnamon-sdk";

import Koa from 'koa';
import { Server } from 'http';
import { Socket } from 'net';

import Loader from "./loader";

export * from './plugin';

/**
 * @internal
 * @private
 */
export type ActiveConnectionMap = {
    [key: string]: Socket;
};

/**
 * @internal
 * @private
 */
export enum WebServerModuleState {
    INITIAL,
    READY,
    ONLINE,
    ERRORED
}

export { Method } from './api/Method';
export { default as Controller } from './api/Controller';
export { default as Route } from './api/Route';
export { default as Middleware } from './api/Middleware';
export { LoadIf, LoadUnless } from './introspection';

export * from './middlewares';

/**
 * @category Core Modules
 * @CoreModule
 * @internal
 * @private
 */
export default class WebServer extends CinnamonModule {

    private readonly controllersPath: string;
    private readonly controllersLoader: Loader;

    private currentState: WebServerModuleState;
    private enableLogging: boolean;

    /**
     * Returns the Koa application instance. Useful for registering Middleware, etc.
     */
    public readonly server: Koa;
    private _underlyingServer?: Server;

    /**
     * Returns the underlying Node HTTP server instance used internally by Koa.
     */
    get underlyingServer () : Server | undefined { return this._underlyingServer; }

    private readonly activeConnections: ActiveConnectionMap;

    /**
     * @CoreModule
     * Initializes a Cinnamon Web Server.
     *
     * @param framework The Cinnamon Framework instance.
     * @param controllersPath The path to the controllers directory.
     * @param trustProxies Whether proxy servers should be trusted
     *                     (as passed from Cinnamon's config file).
     * @private
     */
    constructor(framework: Cinnamon, controllersPath: string, trustProxies: boolean) {
        super(framework);
        this.controllersPath = controllersPath;
        this.server = new Koa();
        this._underlyingServer = undefined;
        this.activeConnections = {};
        this.currentState = WebServerModuleState.INITIAL;
        this.enableLogging = false;

        this.controllersLoader = new Loader({
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
    public get logger() { return this.framework.getModule<Logger>(Logger.prototype); }

    /**
     * Whether or not logging is enabled on the web server.
     */
    public get isLoggingEnabled() { return this.enableLogging; }

    /**
     * Initializes the router with the controllers path that was passed to the constructor.
     * This involves:
     * - scanning the directory for all the controller files,
     * - scanning each controller file for the controller methods,
     * - registering the controller methods (optionally with hot reload if the framework is in dev mode)
     * @private
     */
    public async initialize() {
        this.logger.frameworkDebug("WebServer module is loading route controllers now.");

        // Ensure the controllers directory is present.
        // We do this check in core startup, but this will ensure we're in the correct state
        // even if this module is loaded independently of the default distribution's core class.
        if(!await cinnamonInternals.fs.directoryExists(this.controllersPath)) {
            this.logger.error(`Unable to load web server controllers due to missing controllers directory: ${cinnamonInternals.fs.toAbsolutePath(this.controllersPath)}`);
            await this.framework.terminate(true);
            return;
        }

        const trackingControllersCount = await this.controllersLoader.scanForControllers();
        this.logger.info(`Found ${trackingControllersCount} controller${trackingControllersCount !== 1 ? 's' : ''}.`, 'webserver');

        await this.controllersLoader.registerControllers();

        this.logger.frameworkDebug("The internal web server is ready to be started.");
        this.currentState = WebServerModuleState.READY;
    }

    public async start(options: { host: string, port: number, enable_logging?: boolean }) : Promise<void> {
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
            if (this.currentState === WebServerModuleState.ONLINE) reason = "because it is already running.";
            throw new Error(`The web server cannot be started ${reason}`);
        }

        return new Promise((resolve, _reject) => {
            const reject = (reason?: any) => {
                this.currentState = WebServerModuleState.ERRORED;
                _reject(reason);
            }

            try {
                this._underlyingServer = this.server.listen(options.port, options.host, async () => {
                    if (this._underlyingServer == null) return reject("Failed to start web server!");
                    this.logger.info(`Listening for web requests on: http://${options.host}:${options.port}/`);

                    // Credit: https://github.com/isaacs/server-destroy/blob/master/index.js
                    this._underlyingServer?.on('connection', (connection: Socket) => {
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
            } catch(ex) {
                reject(ex);
            }
        })
    }

    public async terminate() : Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.controllersLoader.unregisterWatchers();

                this._underlyingServer?.close((err) => {
                    if (err) return reject(err);

                    for (const key in this.activeConnections)
                        this.activeConnections[key].destroy();

                    this.currentState = WebServerModuleState.INITIAL;
                    return resolve();
                });
            } catch(ex) { reject(ex); }
        });
    }

}
