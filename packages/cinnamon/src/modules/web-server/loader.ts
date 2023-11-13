/**
 * A helper class to handle loading the controllers from their files
 * and installing the routes into the web server.
 *
 * Additionally, when developer mode is active, the loader will enable
 * hot reload and watch for changes.
 *
 * @module
 */

import Cinnamon from '../../core';
import cinnamonInternals, { $Cinnamon } from '@apollosoftwarexyz/cinnamon-internals';
import LoggerModule from '../../modules/logger';

import WebServerModule from './index';
import { Method } from './api/Method';
import { MiddlewareFn } from './api/Middleware';

import * as Chokidar from 'chokidar';
import * as Module from 'module';
import * as chalk from 'chalk';
import * as path from 'path';

import co from 'co';

import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import { DatabaseModuleStub } from '../_stubs/database';
import { MissingModuleError } from '../../sdk/base';
import sendFile, { SendFileOptions } from './lib/files';

import { Context, Request } from '../../index';
import { Next } from 'koa';

import * as Youch from '@apollosoftwarexyz/cinnamon-youch';

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
export const LOADER_ROOT_ROUTE_NAMESPACE = '29af6f1b-7584-484a-b627-8b25d47021ec';

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
    handler: (cinnamon: Cinnamon, ...args: any[]) => void;

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
    private readonly owner: WebServerModule;
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
        // @ts-expect-error - this is a private API.
        load: Module.prototype.load as any,
        require: Module.prototype.require as any,
    };

    constructor(options: {

        /**
         * The Cinnamon framework instance this loader's owner (and, by extension,
         * this loader) belongs to.
         */
        framework: Cinnamon,

        /**
         * The WebServer instance this Loader belongs to.
         */
        owner: WebServerModule,

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
            this.framework.getModule<LoggerModule>(LoggerModule.prototype).info(`Changes detected. Reloaded ${trackingControllersCount} controller${trackingControllersCount !== 1 ? 's' : ''}.`);
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

        if (activeLoader != null) {
            throw new FatalLoaderError(
                true,
                'Attempted to lock already locked activeLoader interface.\n\n' +
                'This might happen if:\n' +
                "\t- you run two web servers in development mode simultaneously (don't)\n" +
                '\t- a controller is stuck whilst loading (restart or investigate if\n' +
                '\t\tthe problem persists)\n' +
                '\t- a controller caused a fatal error, but for some reason, the framework' +
                "\t\tdidn't shut down. (try restarting the framework, if the problem persists\n" +
                '\t\tpost an issue ticket on the Cinnamon project repository with any errors\n' +
                '\t\tyou receive before this one.)\n\n' +
                '\t(Apollo Software only): please consider opening an issue with the Internal Projects team.'
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        activeLoader = this;

        for (const controller of this.trackedControllers) {
            const requireFn = this.inDevMode ? this.hotRequire : this.doRequire;

            try {
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
            } catch (ex) {
                console.log((ex as any).stack);

                const errorMessage = (ex as any)?.toString();

                this.framework.getModule<LoggerModule>(LoggerModule.prototype).error(
                    ((ex instanceof FatalLoaderError && ex.isControllerAgnostic)
                        ? 'Error processing controllers...'
                        : `Error loading controller: ${path.basename(controller.path)} (${controller.path})`
                    ) + (
                        errorMessage ? `\n\n\t${errorMessage.replace(/\n/g, '\n\t')}\n` : ''
                    )
                );

                if (ex instanceof FatalLoaderError) {
                    await this.framework.terminate(
                        true,
                        'A fatal error with the web server module has prevented Cinnamon from loading.'
                    );
                    return;
                }
            }

            controller.dirty = false;
        }

        activeLoader = undefined;
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            throw new FatalLoaderError(
                false,
                'Attempted to lock missing activeLoader interface.\n' +
                "This would imply that a route attempted to register with a loader when that loader wasn't expecting it."
            );
        }

        if (Object.keys(activeLoader.routes).includes(routeData.identifier)) {
            throw new FatalLoaderError(
                true,
                "UUID collision detected. This shouldn't happen. Please restart the server.\n" +
                'If you see this message more than once, something has gone VERY wrong, please contact us immediately.\n'
            );
        }

        activeLoader.routes[routeData.identifier] = routeData;
    }

    public static loadController(controllerId: string, group: string[], target: any) {
        if (!activeLoader) {
            throw new FatalLoaderError(
                false,
                'Attempted to lock missing activeLoader interface.\n' +
                "This would imply that a controller attempted to register with a loader when that loader wasn't expecting it."
            );
        }

        if (Object.keys(activeLoader.routers).includes(controllerId)) {
            throw new FatalLoaderError(
                true,
                "UUID collision detected. This shouldn't happen. Please restart the server.\n" +
                'If you see this message more than once, something has gone VERY wrong, please contact us immediately.\n'
            );
        }

        // The routing prefix to prepend to each route belonging to this controller.
        const prefix = `/${group.map(item => item.replace(/^\/|\/$/g, '')).join('/')}`;

        const controllerRouter = new KoaRouter({ prefix });
        for (const route of Object.values(activeLoader.routes).filter(route => route.controller === controllerId)) {
            let routePath = route.path.replace(/\/$/g, '');
            if (!routePath.startsWith('/')) routePath = `/${routePath}`;
            if (prefix === '/' && routePath.startsWith('/')) routePath = routePath.substring(1);

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
        target._loaderActivatedController = true;

        // ////////////////////// (sanitization checks)

        // If there is a mismatch between the number of Cinnamon's controller routers and the number of
        // tracked controllers, we must be attempting to load the same controller twice, which (for now)
        // we're going to consider illegal because the only way this can really happen is because one
        // controller imported another that was already loaded by Cinnamon.
        //
        // (Basically, this creates a 'regression bug' with development mode whereby on the first
        // iteration – before the controllers have been reloaded again which eliminates duplicates,
        // this will cause the same controller to load twice and cause issues with koa's routing -
        // and just generally be a nuisance because we clear the cache when we 'hot require' the
        // controller files.)
        //
        // We could probably fiddle with the caching of each class to make this work consistently
        // all-round but to be honest, except for unforeseen circumstances, importing a Cinnamon
        // controller in another controller would just imply poor code structuring or design.
        if (Object.keys(activeLoader.routers).length > activeLoader.trackedControllers.length) {
            throw new FatalLoaderError(
                true,
                'Cinnamon has detected a mismatch between the number of per-controller routers and the number of\n' +
                'controllers.\n\n' +
                'This would typically indicate that you have imported a Cinnamon controller in another Cinnamon\n' +
                'controller, which is currently prevented.\n\n' +
                'EXCEPT FOR unforeseen circumstances, doing this would indicate bad code structuring or design,\n' +
                'however IF you are receiving this error for unrelated reasons – OR you believe you have a good\n' +
                'reason for allowing this, please open an issue ticket on the Cinnamon project repository.\n\n' +
                '(Apollo Software only): please consider opening an issue with the Internal Projects team.\n' +
                'https://github.com/apollosoftwarexyz/cinnamon/issues/new\n'
            );
        }
    }

    public static loadMiddleware(routeId: string, fn: MiddlewareFn) {
        if (!activeLoader) {
            throw new FatalLoaderError(
                false,
                'Attempted to lock missing activeLoader interface.\n' +
                "This would imply that a controller attempted to register with a loader when that loader wasn't expecting it."
            );
        }

        if (!activeLoader.routes[routeId]) {
            throw new Error('Attempted to register middleware for invalid route.');
        }

        activeLoader.routes[routeId].middleware.push(fn);
    }

    /** ********************************************************************/

    private doRequire(request: string, caller?: NodeModule) {
        if (!caller) caller = require.main;
        return this.BuiltinModuleAPI.require.call(caller, request);
    }

    private hotRequire(request: string, caller?: NodeModule) {
        if (!caller) caller = require.main;

        const exports = this.BuiltinModuleAPI.require.call(caller, request);
        const controller = this.trackedControllers.find(controller => controller.path === request);

        let modulePath: string;
        try {
            // @ts-expect-error - this is a private API.
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

        // Inject Cinnamon into the request context.
        this.server.use(async (ctx: Context, next: Next) => {
            ctx.framework = this.framework;
            return await next();
        });

        await this.framework.triggerPluginHook('beforeRegisterErrors');

        // Register the error handler. We do this after 'beforeRegisterControllers' to allow plugins to get
        // priority when they work with the error handler.
        this.server.use(async (ctx: Context, next) => {
            try {
                await next();

                // If we got a 404 error with no response body, return a response according to the
                // request type.
                if (ctx.status === 404 && !ctx.body) {
                    if (ctx.request.is('application/json')) {
                        ctx.status = 404;
                        ctx.body = {
                            success: false,
                            error: 'ERR_NOT_FOUND',
                            message: 'The resource you requested could not be found.'
                        };
                    } else {
                        ctx.status = 404;
                        ctx.body = '';
                    }
                }
            } catch (err: any) {
                err.status = err.statusCode || err.status || 500;
                ctx.status = err.status;

                // Load the JavaScript error object.
                ctx.errorObject = err;

                // Render error output in the browser if no other output has been rendered.
                if (!ctx.body) {
                    // If it was a JSON request, we'll return JSON.
                    // (and if we're in development mode, we'll include some useful development information.)
                    if (ctx.request.is('application/json') || ctx.request.type === 'application/json') {
                        ctx.response.headers['content-type'] = 'application/json';
                        const payload: any = {
                            success: false
                        };

                        // Include development information if we're in dev mode.
                        if (this.inDevMode) {
                            const youch = new Youch(err, {});

                            payload['devInfo'] = {
                                status: err.status,
                                message: err.toString(),
                                timestamp: (new Date().toUTCString()),
                                ...(await youch.toJSON())
                            };
                        }

                        ctx.body = payload;
                    } else {
                        // Otherwise, we'll assume it was a browser request.
                        ctx.response.headers['content-type'] = 'text/html';

                        // In which case, we'll return a nice error page, courtesy of 'youch' if we're in
                        // development mode...
                        if (this.inDevMode && !(err instanceof cinnamonInternals.error.HttpError)) {
                            const youch = new Youch(err, ctx.req);
                            ctx.body = await youch.toHTML();
                        } else {
                            // Otherwise, we'll return an empty response which will cause the browser to show
                            // its default error page.
                            ctx.body = '';
                        }
                    }
                }

                // Print the error.
                if (!(err instanceof cinnamonInternals.error.HttpError)) {
                    console.error('');
                    console.error(chalk.red(err.stack.toString().replace('\n>\t', '\n\t')));
                    console.error('');
                }
            }
        });

        await this.framework.triggerPluginHook('beforeRegisterControllers');

        // Register lib/ functions on the request context.
        this.server.use(async (ctx: Context, next: Next) => {
            ctx.sendFile = (path: string, options: SendFileOptions) => sendFile(ctx, path, options);
            return await next();
        });

        // If the database has been initialized, register the middleware with Koa to create a new request context
        // for each request and register a middleware to add an entity manager to the context.
        if (this.framework.hasModule<DatabaseModuleStub>(DatabaseModuleStub.prototype) &&
            this.framework.getModule<DatabaseModuleStub>(DatabaseModuleStub.prototype).isInitialized) {
            // Create request context.
            this.server.use((_ctx, next) => this.framework
                .getModule<DatabaseModuleStub>(DatabaseModuleStub.prototype)
                .requestContext
                .createAsync(
                    this.framework.getModule<DatabaseModuleStub>(DatabaseModuleStub.prototype).em, next
                )
            );

            // Add entity manager to context.
            this.server.use(async (ctx, next) => {
                ctx.getEntityManager = () => this.framework
                    .getModule<DatabaseModuleStub>(DatabaseModuleStub.prototype)
                    .requestContext.getEntityManager();
                return await next();
            });
        } else {

            this.server.use((ctx, next) => {
                ctx.getEntityManager = () => {
                    if (!this.framework.hasModule<DatabaseModuleStub>(DatabaseModuleStub.prototype)) {
                        throw new MissingModuleError('@apollosoftwarexyz/cinnamon-database');
                    } else {
                        throw new Error('The database module is present but has not been initialized, so you cannot use ctx.getEntityManager.\nPlease ensure your database configuration is correct!\n');
                    }
                };
                return next();
            });

        }

        // Register a middleware to check if the body attribute on the context is usable (because the body
        // middleware has to be registered for it to be used.)
        this.server.use(async (ctx, next) => {
            const bodyProxy = () => {
                // Might investigate this further – but it's probably better to check only if the body was initialized,
                // rather than the rawBody as well as it would give more flexibility with middleware.
                let didSetBodyValue: boolean;

                return {
                    get: function (object: any, key: string | symbol): any {
                        if ((key == 'body' || key == 'rawBody') && !didSetBodyValue) {
                            const errorText = (ctx.request as Request<any> & { [$Cinnamon]: any })[$Cinnamon].bodyError
                                ?? 'You must use the Body middleware to access the request body. ' +
                                   'You should annotate your request handler (route) with:\n' +
                                   '>\t@Middleware(Body())' +
                                   '\n';

                            throw new Error(errorText);
                        }

                        return object[key];
                    },
                    set: function (object: any, key: string | symbol, value: any): boolean {
                        if (key == 'body') didSetBodyValue = true;
                        if (key == 'rawBody') didSetBodyValue = true;

                        // Implement the default setter to set the value.
                        object[key] = value;

                        // Indicate success.
                        return true;
                    }
                };
            };

            ctx.request = new Proxy(ctx.request, bodyProxy());

            return await next();
        });

        /*
        Register a middleware on the Koa instance that loops through all the loaded
        middleware in this loader instance and executes them.
         */
        this.server.use(co.wrap(function* (ctx, next) {
            (ctx.request as Request<any> & { [$Cinnamon]: any })[$Cinnamon] = {};

            for (const handler of Object.values(routers)) {
                // If the handler yielded a result, and there wasn't one already, we'll
                // assume that the expectation was for that result to be the body.
                const result = yield handler.routes()(ctx, async () => {});
                if (result && (ctx.status === 404 || !ctx.body)) ctx.body = result;

                yield handler.allowedMethods()(ctx, async () => {});
            }

            yield next();
        }));

        await this.framework.triggerPluginHook('afterRegisterControllers');

        // eslint-disable-next-line @typescript-eslint/no-this-alias
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

class FatalLoaderError extends Error {

    /**
     * Set this to true if the error was not triggered by a specific controller,
     * to ensure that the loader does not inject the currently processing
     * controller into the error message.
     */
    isControllerAgnostic: boolean;

    constructor(controllerAgnostic?: boolean, message?: string) {
        super(message);
        this.isControllerAgnostic = controllerAgnostic ?? false;
    }

}
