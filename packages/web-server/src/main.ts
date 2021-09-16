import Cinnamon, { CinnamonModule } from "@apollosoftwarexyz/cinnamon-core";
import Logger from "@apollosoftwarexyz/cinnamon-logger";
import cinnamonInternals from "@apollosoftwarexyz/cinnamon-core-internals";

import * as Koa from 'koa';
import { Server } from 'http';
import { Socket } from 'net';

import Loader from "./loader";

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

    private readonly server: Koa;
    private underlyingServer?: Server;
    private readonly activeConnections: ActiveConnectionMap;

    /**
     * @CoreModule
     * Initializes a Cinnamon Web Server.
     *
     * @param framework The Cinnamon Framework instance.
     * @param controllersPath The path to the controllers directory.
     * @private
     */
    constructor(framework: Cinnamon, controllersPath: string) {
        super(framework);
        this.controllersPath = controllersPath;
        this.server = new Koa();
        this.underlyingServer = undefined;
        this.activeConnections = {};
        this.currentState = WebServerModuleState.INITIAL;
        this.enableLogging = false;

        this.controllersLoader = new Loader({
            framework,
            owner: this,
            server: this.server,
            controllersPath: this.controllersPath
        });
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

        // Ensure the controllers directory is loaded.
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
                this.underlyingServer = this.server.listen(options.port, options.host, () => {
                    if (this.underlyingServer == null) return reject("Failed to start web server!");
                    this.logger.info(`Listening for web requests on: http://${options.host}:${options.port}/`);

                    // Credit: https://github.com/isaacs/server-destroy/blob/master/index.js
                    this.underlyingServer?.on('connection', (connection: Socket) => {
                        const key = `${connection.remoteAddress}:${connection.remotePort}`;
                        this.activeConnections[key] = connection;

                        connection.on('close', () => delete this.activeConnections[key]);
                    });

                    this.currentState = WebServerModuleState.READY;
                    return resolve();
                });
            } catch(ex) {
                reject(ex);
            }
        })
    }

    public async terminate() : Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.underlyingServer?.close((err) => {
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
