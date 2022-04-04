/// <reference types="node" />
import type Cinnamon from "../../core";
import { CinnamonModule } from "../../sdk/cinnamon-module";
import LoggerModule from "../logger";
import * as Koa from 'koa';
import { Server } from 'http';
import { Socket } from 'net';
export * from './plugin';
/**
 * @internal
 * @private
 */
export declare type ActiveConnectionMap = {
    [key: string]: Socket;
};
/**
 * @internal
 * @private
 */
export declare enum WebServerModuleState {
    INITIAL = 0,
    READY = 1,
    ONLINE = 2,
    ERRORED = 3
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
export default class WebServerModule extends CinnamonModule {
    private readonly controllersPath;
    private readonly controllersLoader;
    private currentState;
    private enableLogging;
    /**
     * Returns the Koa application instance. Useful for registering Middleware, etc.
     */
    readonly server: Koa;
    private _underlyingServer?;
    /**
     * Returns the underlying Node HTTP server instance used internally by Koa.
     */
    get underlyingServer(): Server | undefined;
    private readonly activeConnections;
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
    constructor(framework: Cinnamon, controllersPath: string, trustProxies: boolean);
    /**
     * The current framework instance's logger.
     */
    get logger(): LoggerModule;
    /**
     * Whether logging is enabled on the web server.
     */
    get isLoggingEnabled(): boolean;
    /**
     * Initializes the router with the controllers path that was passed to the constructor.
     * This involves:
     * - scanning the directory for all the controller files,
     * - scanning each controller file for the controller methods,
     * - registering the controller methods (optionally with hot reload if the framework is in dev mode)
     * @private
     */
    initialize(): Promise<void>;
    start(options: {
        host: string;
        port: number;
        enable_logging?: boolean;
    }): Promise<void>;
    terminate(): Promise<void>;
}
