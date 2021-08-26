import Cinnamon, { CinnamonModule } from "@apollosoftwarexyz/cinnamon-core";
import Logger from "@apollosoftwarexyz/cinnamon-logger";

import * as Koa from 'koa';
import { Server } from 'http';
import { Socket } from 'net';

type ActiveConnectionMap = {
    [key: string]: Socket;
};

enum WebServerModuleState {
    INITIAL,
    READY,
    ONLINE,
    ERRORED
}

/**
 * @private
 */
export default class WebServer extends CinnamonModule {

    private readonly controllersPath: string;

    private currentState: WebServerModuleState;

    private server: Koa;
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
    }

    /**
     * The current framework instance's logger.
     * @private
     */
    private get logger() { return this.framework.getModule<Logger>(Logger.prototype); }

    /**
     * Initializes the router with the controllers path that was passed to the constructor.
     * This involves:
     * - scanning the directory for all the controller files,
     * - scanning each controller file for the controller methods,
     * - registering the controller methods (optionally with hot reload if the framework is in dev mode)
     * @private
     */
    public initialize() {
        this.logger.frameworkDebug("WebServer module is loading route controllers now.");

        

        this.logger.frameworkDebug("The internal web server is ready to be started.");
        this.currentState = WebServerModuleState.READY;
    }

    public async start(options: { host: string, port: number }) : Promise<void> {
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
