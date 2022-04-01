/**
 * A helper class to handle loading the controllers from their files
 * and installing the routes into the web server.
 *
 * Additionally, when developer mode is active, the loader will enable
 * hot reload and watch for changes.
 *
 * @module
 */
import Cinnamon from "../../core";
import WebServerModule from "./index";
import { Method } from "./api/Method";
import { MiddlewareFn } from "./api/Middleware";
import Koa from 'koa';
/**
 * @internal
 * @private
 *
 * The root namespace for loaded routes.
 *
 * The hierarchy for namespaced routes is as follows:
 * ROOT -> Class (Controller) -> Method (Route)
 */
export declare const LOADER_ROOT_ROUTE_NAMESPACE = "29af6f1b-7584-484a-b627-8b25d47021ec";
/**
 * @internal
 * @private
 *
 * A route that has been loaded by the loader's annotation API.
 * This is populated with the route's data and stored in {@link Loader.routes},
 * so it can be registered on the controller's router.
 */
interface LoaderRoute {
    /**
     * The unique namespaced identifier (UUID v5) for this route.
     */
    identifier: string;
    /**
     * The ID of the controller this route belongs to.
     */
    controller: string;
    /**
     * The HTTP method this route should be accessed from.
     */
    method: Method;
    /**
     * The HTTP path this route should be accessed from.
     */
    path: string;
    /**
     * The handler function implemented in the controller for this route.
     */
    handler: Function;
    /**
     * An array of middleware functions that should be executed before this
     * route.
     */
    middleware: MiddlewareFn[];
}
/**
 * @internal
 * @private
 *
 * This variable is a reserved placeholder, temporarily set when the loader is
 * active to allow the annotation API to hook into the loader to register routes.
 */
export declare let activeLoader: Loader | undefined;
/**
 * @internal
 * @private
 */
export default class Loader {
    readonly framework: Cinnamon;
    private readonly owner;
    private readonly server;
    private readonly controllersPath;
    private trackedControllers;
    private watcher?;
    /**
     * Maps a controller ID to a KoaRouter. This is used for replacing the controller's router
     * upon controller module reload.
     * @private
     */
    private readonly routers;
    /**
     * Maps a route ID to a LoaderRoute containing the route's information.
     * This is used to store the information collected when a controller is required and its routes
     * are loaded (when the annotations are called, they populate this map).
     * @private
     */
    private readonly routes;
    readonly BuiltinModuleAPI: {
        load: any;
        require: any;
    };
    constructor(options: {
        /**
         * The Cinnamon framework instance this loader's owner (and, by extension,
         * this loader) belongs to.
         */
        framework: Cinnamon;
        /**
         * The WebServer instance this Loader belongs to.
         */
        owner: WebServerModule;
        /**
         * The underlying Koa server from the WebServer.
         */
        server: Koa;
        /**
         * The path to the directory containing the controllers that should be loaded.
         */
        controllersPath: string;
    });
    get inDevMode(): boolean;
    /**
     * Scans the controllers directory, determining which controllers should be tracked.
     * @param postInitial Whether this is after the initial loading of the controllers.
     */
    scanForControllers(postInitial?: boolean): Promise<number>;
    /**
     * Registers the routes from the scanned controllers.
     *
     * This loops through the list of loaded controllers in the loader, registering
     * any controllers marked as dirty, unloading previous instances where necessary,
     * finally marking them as not dirty.
     */
    registerControllers(): Promise<void>;
    /**
     * Registers file watchers for the controllers.
     *
     * Will not do anything if not in development mode. Additionally, this should not
     * be called if autostart is not set on the framework as, naturally, it will cause
     * the framework to persist running.
     */
    registerWatchers(): Promise<void>;
    /**
     * Unregisters file watchers for the controllers.
     *
     * Does nothing if the file watchers weren't already running.
     */
    unregisterWatchers(): Promise<void>;
    /**
     * For internal framework use.
     *
     * Used by the route loader annotation API to register a route with the active loader.
     * @param routeData
     * @private
     */
    static loadRoute(routeData: LoaderRoute): void;
    static loadController(controllerId: string, group: string[], target: any): void;
    static loadMiddleware(routeId: string, fn: MiddlewareFn): void;
    /**********************************************************************/
    private doRequire;
    private hotRequire;
    /**
     * Registers all Controllers' and Middlewares' route with Koa.
     * @private
     */
    private hookWithKoa;
    private unhookWithKoa;
}
export {};
