/**
 * A helper class to handle loading the controllers from their files
 * and installing the routes into the web server.
 *
 * Additionally, when developer mode is active, the loader will enable
 * hot reload and watch for changes.
 *
 * @module
 */

import Cinnamon from "@apollosoftwarexyz/cinnamon-core";
import Logger from "@apollosoftwarexyz/cinnamon-logger";
import cinnamonInternals from "@apollosoftwarexyz/cinnamon-core-internals";
import WebServer from "./main";
import { Method } from "./api/Method";
import { MiddlewareFn } from "./api/Middleware";

import * as Chokidar from 'chokidar';
import Module from "module";
import chalk from 'chalk';

import co from 'co';

import Koa from 'koa';
import KoaRouter from 'koa-router';
import Database from "@apollosoftwarexyz/cinnamon-database";
import { RequestContext } from "@mikro-orm/core";

/**
 * @internal
 * @private
 */
interface TrackedController {
    /**
     * The absolute path to the controller.
     */
    path: string;

    /**
     * The resolved module path to the controller.
     */
    modulePath?: string;

    /**
     * The date the controller file was last modified. This helps the loader to
     * detect which modules should be re-registered.
     * This will not be set if the loader is not in development mode.
     */
    dateModified?: Date;

    /**
     * Allows the loader to mark the controller as 'dirty' after scanning the
     * directory - thereby indicating that the controller should be re-registered.
     */
    dirty: boolean;
}

/**
 * @internal
 * @private
 *
 * The root namespace for loaded routes.
 *
 * The hierarchy for namespaced routes is as follows:
 * ROOT -> Class (Controller) -> Method (Route)
 */
export const LOADER_ROOT_ROUTE_NAMESPACE = "29af6f1b-7584-484a-b627-8b25d47021ec";

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
export let activeLoader: Loader | undefined;

/**
 * @internal
 * @private
 * Represents the mapping on {@link Loader.routers}.
 */
type ControllerIdToRouterDictionary = {
    [key: string]: KoaRouter;
}

/**
 * @internal
 * @private
 * Represents the mapping on {@link Loader.routes}.
 */
type RouteIdToRouteDataDictionary = {
    [key: string]: LoaderRoute;
}

/**
 * @internal
 * @private
 */
export default class Loader {

    public readonly framework: Cinnamon;
    private readonly owner: WebServer;
    private readonly server: Koa;

    private readonly controllersPath: string;
    private trackedControllers: TrackedController[];

    private watcher?: Chokidar.FSWatcher;

    /**
     * Maps a controller ID to a KoaRouter. This is used for replacing the controller's router
     * upon controller module reload.
     * @private
     */
    private readonly routers: ControllerIdToRouterDictionary;

    /**
     * Maps a route ID to a LoaderRoute containing the route's information.
     * This is used to store the information collected when a controller is required and its routes
     * are loaded (when the annotations are called, they populate this map).
     * @private
     */
    private readonly routes: RouteIdToRouteDataDictionary;

    public readonly BuiltinModuleAPI = {
        // @ts-ignore
        load: Module.prototype.load as any,
        // @ts-ignore
        require: Module.prototype.require as any,
    }

    constructor(options: {
        /**
         * The Cinnamon framework instance this loader's owner (and, by extension,
         * this loader) belongs to.
         */
        framework: Cinnamon,

        /**
         * The WebServer instance this Loader belongs to.
         */
        owner: WebServer,

        /**
         * The underlying Koa server from the WebServer.
         */
        server: Koa,

        /**
         * The path to the directory containing the controllers that should be loaded.
         */
        controllersPath: string
    }) {
        this.framework = options.framework;
        this.owner = options.owner;
        this.server = options.server;
        this.controllersPath = options.controllersPath;
        this.trackedControllers = [];

        this.routers = {};
        this.routes = {};
    }

    get inDevMode() {
        return this.framework.inDevMode;
    }

    /**
     * Scans the controllers directory, determining which controllers should be tracked.
     * @param postInitial Whether this is after the initial loading of the controllers.
     */
    async scanForControllers(postInitial: boolean = false) : Promise<number> {
        let trackingControllersCount = 0;

        // We use a temporary variable to make this operation atomic.
        let discoveredControllers: TrackedController[] = this.trackedControllers;

        // Scan for controller files.
        for (let controllerFile of await cinnamonInternals.fs.listRecursively(this.controllersPath)) {
            // Our supported controller files are currently only .ts files.

            // At some point JS support could be considered, but JS is undesirable for large projects
            // such as those which might be undertaken with this framework and ts-node can run
            // TypeScript applications with no/negligible performance penalty; particularly in
            // production.

            if (controllerFile.endsWith('.ts')) {
                const existingController = discoveredControllers.find((controller) => controller.path === controllerFile);
                const dateModified = await cinnamonInternals.fs.getLastModification(controllerFile);

                // If the controller is not present, add it to the list of controllers.
                if (!existingController) {
                    discoveredControllers.push({
                        path: controllerFile,
                        dateModified,
                        dirty: true
                    });

                    trackingControllersCount++;
                } else {
                    // Otherwise, just mark the existing controller as dirty if the file modification date is
                    // newer and then update the modification time.
                    // If the modification time is not present and we were now able to obtain one, we can also
                    // consider that a change as means of handling that edge case.
                    if (!existingController.dateModified || dateModified.getTime() > existingController.dateModified!.getTime()) {
                        existingController.dateModified = dateModified;
                        existingController.dirty = true;
                    }

                    trackingControllersCount++;
                }
            }
        }

        if (postInitial) {
            this.framework.getModule<Logger>(Logger.prototype).info(`Changes detected. Reloaded ${trackingControllersCount} controller${trackingControllersCount !== 1 ? 's' : ''}.`);
        }

        this.trackedControllers = discoveredControllers;
        return trackingControllersCount;
    }

    /**
     * Registers the routes from the scanned controllers.
     *
     * This loops through the list of loaded controllers in the loader, registering
     * any controllers marked as dirty, unloading previous instances where necessary,
     * finally marking them as not dirty.
     */
    async registerControllers() {
        this.unhookWithKoa();

        Object.keys(this.routes).forEach(route => delete this.routes[route]);
        Object.keys(this.routers).forEach(router => delete this.routers[router]);

        for (const controller of this.trackedControllers) {
            const requireFn = this.inDevMode ? this.hotRequire : this.BuiltinModuleAPI.require;

            if (activeLoader != null) {
                throw new Error(
                    "Attempted to lock already locked activeLoader interface.\n" +
                    "This might happen if you run two web servers in development mode simultaneously."
                );
            }
            activeLoader = this;

            const controllerObject = requireFn.call(this, controller.path);

            try {
                const clazz = controllerObject.default;
                clazz.__cinnamonInstance = new clazz();
            } catch (ex) {
                throw new Error(
                    `Failed to read controller in ${controller.path}.\n` +
                    `Make sure you export it with 'export default' and that your project supports ES6+ classes.`
                );
            }

            activeLoader = undefined;
            controller.dirty = false;
        }

        await this.hookWithKoa();
    }

    /**
     * Registers file watchers for the controllers.
     *
     * Will not do anything if not in development mode. Additionally, this should not
     * be called if autostart is not set on the framework as, naturally, it will cause
     * the framework to persist running.
     */
    async registerWatchers() {
        if (!this.inDevMode) return;

        await this.unregisterWatchers();

        this.watcher = Chokidar.watch(this.trackedControllers.map(controller => controller.path), {
            persistent: true,
            ignoreInitial: true
        });

        this.watcher.on('all', () => {
            setTimeout(() => {
                this.scanForControllers(true).then(_ => this.registerControllers());
            }, 100);
        });
    }

    /**
     * Unregisters file watchers for the controllers.
     *
     * Does nothing if the file watchers weren't already running.
     */
    async unregisterWatchers() {
        if (this.watcher) {
            await this.watcher.close();
        }
    }

    /**
     * For internal framework use.
     *
     * Used by the route loader annotation API to register a route with the active loader.
     * @param routeData
     * @private
     */
    public static loadRoute(routeData: LoaderRoute) {
        if (!activeLoader) {
            throw new Error(
                "Attempted to lock missing activeLoader interface.\n" +
                "This would imply that a route attempted to register with a loader when that loader wasn't expecting it."
            );
        }

        if (Object.keys(activeLoader.routes).includes(routeData.identifier)) {
            throw new Error(
                "Duplicate route ID registered; this should be impossible.\n" +
                "Please ensure all route IDs are unique."
            );
        }

        activeLoader.routes[routeData.identifier] = routeData;
    }

    public static loadController(controllerId: string, group: string[], target: any) {
        if (!activeLoader) {
            throw new Error(
                "Attempted to lock missing activeLoader interface.\n" +
                "This would imply that a controller attempted to register with a loader when that loader wasn't expecting it."
            );
        }

        if (Object.keys(activeLoader.routers).includes(controllerId)) {
            throw new Error(
                "Duplicate router for controller ID registered; this should be impossible.\n" +
                "Please ensure each controller has one and only one router."
            );
        }

        // The routing prefix to prepend to each route belonging to this controller.
        const prefix = `/${group.map(item => item.replace(/^\/|\/$/g, '')).join('/')}`;

        const controllerRouter = new KoaRouter({ prefix });
        for (const route of Object.values(activeLoader.routes).filter(route => route.controller === controllerId)) {
            let routePath = route.path.replace(/\/$/g, '');
            if (!routePath.startsWith('/')) routePath = `/${routePath}`;

            // @ts-ignore
            const registerKoaRoute = controllerRouter[route.method.toLowerCase()];

            registerKoaRoute.call(
                controllerRouter,
                route.identifier,
                routePath,
                ...route.middleware,
                (...args: any[]) => route.handler.call(
                    target.__cinnamonInstance, ...args
                )
            );
        }

        activeLoader.routers[controllerId] = controllerRouter;
    }

    public static loadMiddleware(routeId: string, fn: MiddlewareFn) {
        if (!activeLoader) {
            throw new Error(
                "Attempted to lock missing activeLoader interface.\n" +
                "This would imply that a controller attempted to register with a loader when that loader wasn't expecting it."
            );
        }

        if (!activeLoader.routes[routeId]) {
            throw new Error("Attempted to register middleware for invalid route.");
        }

        activeLoader.routes[routeId].middleware.push(fn);
    }

    /**********************************************************************/

    private hotRequire(request: string, caller?: NodeModule) {
        if (!caller) caller = require.main;

        const exports = this.BuiltinModuleAPI.require.call(caller, request);
        const controller = this.trackedControllers.find(controller => controller.path === request);

        let modulePath: string;
        try {
            // @ts-ignore
            modulePath = Module._resolveFilename(request, caller);
        } catch (ex) {
            // Error whilst resolving module.
            return exports;
        }

        // Ensure that we only patch our controller files.
        if (!controller) return exports;
        if (modulePath) {
            delete require.cache[modulePath];
        }

        return exports;
    }

    /**
     * Registers all Controllers' and Middlewares' route with Koa.
     * @private
     */
    private async hookWithKoa() {
        const routers = this.routers;

        // If the database has been initialized, register the middleware with Koa to create a new request context
        // for each request and register a middleware to add an entity manager to the context.
        if (this.framework.getModule<Database>(Database.prototype).isInitialized) {
            // Create request context.
            this.server.use((ctx, next) => RequestContext.createAsync(
                this.framework.getModule<Database>(Database.prototype).em, next
            ));

            // Add entity manager to context.
            this.server.use(async (ctx, next) => {
                ctx.getEntityManager = () => RequestContext.getEntityManager();
                return await next();
            });
        }

        // Register a middleware to check if the body attribute on the context is usable (because the body
        // middleware has to be registered for it to be used.)
        this.server.use(async (ctx, next) => {
            (() => {
                let bodyValue: any;
                Object.defineProperty(ctx.request, 'body', {
                    get: () => {
                        if (!bodyValue)
                            throw new Error(
                                "You must use the body middleware to access the request body.\n" +
                                "Annotate your request handler (route) with:\n\n" +
                                "@Middleware(Body())"
                            );
                        return bodyValue;
                    },
                    set: function (value) {
                        bodyValue = value;
                    }
                });
            })();

            return await next();
        });

        await this.framework.triggerPluginHook('beforeRegisterControllers');

        /*
        Register a middleware on the Koa instance that loops through all the loaded
        middleware in this loader instance and executes them.
         */
        this.server.use(co.wrap(function* (ctx, next) {
            for (const handler of Object.values(routers)) {
                yield handler.routes()(ctx, async () => {});
                yield handler.allowedMethods()(ctx, async () => {});
            }

            yield next();
        }));

        await this.framework.triggerPluginHook('afterRegisterControllers');

        const self = this;
        this.server.use(co.wrap(function* (ctx: Koa.BaseContext, next) {
            // Take a reading of the start time so we can calculate how long the
            // response took.
            const start = new Date().getTime();

            // Yield to the response handler, so we can observe what the state is
            // after the response was handled.
            yield next();

            // Take a reading after the response was handled and perform the duration
            // calculation.
            const responseTimeMs = new Date().getTime() - start;

            // Determine the response status code for log formatting.
            const statusCode: number = ctx.status;

            // If it's not a server error status (>= 500) and logging is disabled,
            // don't log.
            if (!self.owner.isLoggingEnabled && statusCode < 500) return;

            // Determine status code decoration.
            let status: string = `[${statusCode}]`;

            if (statusCode >= 100 && statusCode < 200) status = chalk.cyanBright(status);
            else if (statusCode >= 200 && statusCode < 300) status = chalk.greenBright(status);
            else if (statusCode >= 300 && statusCode < 400) status = chalk.blueBright(status);
            else if (statusCode >= 400 && statusCode < 500) status = chalk.redBright(status);
            else if (statusCode >= 500) status = chalk.bgRedBright(status);

            if (statusCode < 400)
                self.owner.logger.debug(`${status} ${ctx.method} ${ctx.path} (${responseTimeMs}ms) - ${ctx.headers['user-agent']}`);
            else
                self.owner.logger.error(`${status} ${ctx.method} ${ctx.path} (${responseTimeMs}ms) - ${ctx.headers['user-agent']}`);
        }));
    }

    private unhookWithKoa() {
        // Clears all of Koa's middleware, by emptying the middleware list on the underlying
        // Koa application server.
        this.server.middleware = [];
    }

}
