"use strict";
/**
 * A helper class to handle loading the controllers from their files
 * and installing the routes into the web server.
 *
 * Additionally, when developer mode is active, the loader will enable
 * hot reload and watch for changes.
 *
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeLoader = exports.LOADER_ROOT_ROUTE_NAMESPACE = void 0;
const cinnamon_internals_1 = require("@apollosoftwarexyz/cinnamon-internals");
const logger_1 = require("../../modules/logger");
const Chokidar = require("chokidar");
const Module = require("module");
const chalk = require("chalk");
const path = require("path");
const co_1 = require("co");
const KoaRouter = require("koa-router");
const database_1 = require("../_stubs/database");
const base_1 = require("../../sdk/base");
const files_1 = require("./lib/files");
/**
 * @internal
 * @private
 *
 * The root namespace for loaded routes.
 *
 * The hierarchy for namespaced routes is as follows:
 * ROOT -> Class (Controller) -> Method (Route)
 */
exports.LOADER_ROOT_ROUTE_NAMESPACE = "29af6f1b-7584-484a-b627-8b25d47021ec";
/**
 * @internal
 * @private
 */
class Loader {
    framework;
    owner;
    server;
    controllersPath;
    trackedControllers;
    watcher;
    /**
     * Maps a controller ID to a KoaRouter. This is used for replacing the controller's router
     * upon controller module reload.
     * @private
     */
    routers;
    /**
     * Maps a route ID to a LoaderRoute containing the route's information.
     * This is used to store the information collected when a controller is required and its routes
     * are loaded (when the annotations are called, they populate this map).
     * @private
     */
    routes;
    BuiltinModuleAPI = {
        // @ts-ignore
        load: Module.prototype.load,
        // @ts-ignore
        require: Module.prototype.require,
    };
    constructor(options) {
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
    async scanForControllers(postInitial = false) {
        let trackingControllersCount = 0;
        // We use a temporary variable to make this operation atomic.
        let discoveredControllers = this.trackedControllers;
        // Scan for controller files.
        for (let controllerFile of await cinnamon_internals_1.default.fs.listRecursively(this.controllersPath)) {
            // Our supported controller files are currently only .ts files.
            // At some point JS support could be considered, but JS is undesirable for large projects
            // such as those which might be undertaken with this framework and ts-node can run
            // TypeScript applications with no/negligible performance penalty; particularly in
            // production.
            if (controllerFile.endsWith('.ts')) {
                const existingController = discoveredControllers.find((controller) => controller.path === controllerFile);
                const dateModified = await cinnamon_internals_1.default.fs.getLastModification(controllerFile);
                // If the controller is not present, add it to the list of controllers.
                if (!existingController) {
                    discoveredControllers.push({
                        path: controllerFile,
                        dateModified,
                        dirty: true
                    });
                    trackingControllersCount++;
                }
                else {
                    // Otherwise, just mark the existing controller as dirty if the file modification date is
                    // newer and then update the modification time.
                    // If the modification time is not present and we were now able to obtain one, we can also
                    // consider that a change as means of handling that edge case.
                    if (!existingController.dateModified || dateModified.getTime() > existingController.dateModified.getTime()) {
                        existingController.dateModified = dateModified;
                        existingController.dirty = true;
                    }
                    trackingControllersCount++;
                }
            }
        }
        if (postInitial) {
            this.framework.getModule(logger_1.default.prototype).info(`Changes detected. Reloaded ${trackingControllersCount} controller${trackingControllersCount !== 1 ? 's' : ''}.`);
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
        if (exports.activeLoader != null) {
            throw new FatalLoaderError(true, "Attempted to lock already locked activeLoader interface.\n\n" +
                "This might happen if:\n" +
                "\t- you run two web servers in development mode simultaneously (don't)\n" +
                "\t- a controller is stuck whilst loading (restart or investigate if\n" +
                "\t\tthe problem persists)\n" +
                "\t- a controller caused a fatal error, but for some reason, the framework" +
                "\t\tdidn't shut down. (try restarting the framework, if the problem persists\n" +
                "\t\tpost an issue ticket on the Cinnamon project repository with any errors\n" +
                "\t\tyou receive before this one.)\n\n" +
                "\t(Apollo Software only): please consider opening an issue with the Internal Projects team.");
        }
        exports.activeLoader = this;
        for (const controller of this.trackedControllers) {
            const requireFn = this.inDevMode ? this.hotRequire : this.doRequire;
            try {
                const controllerObject = requireFn.call(this, controller.path);
                try {
                    const clazz = controllerObject.default;
                    clazz.__cinnamonInstance = new clazz();
                }
                catch (ex) {
                    throw new Error(`Failed to read controller in ${controller.path}.\n` +
                        `Make sure you export it with 'export default' and that your project supports ES6+ classes.`);
                }
            }
            catch (ex) {
                const errorMessage = ex?.toString();
                this.framework.getModule(logger_1.default.prototype).error(((ex instanceof FatalLoaderError && ex.isControllerAgnostic)
                    ? "Error processing controllers..."
                    : `Error loading controller: ${path.basename(controller.path)} (${controller.path})`) + (errorMessage ? `\n\n\t${errorMessage.replace(/\n/g, '\n\t')}\n` : ''));
                if (ex instanceof FatalLoaderError) {
                    await this.framework.terminate(true, "A fatal error with the web server module has prevented Cinnamon from loading.");
                    return;
                }
            }
            controller.dirty = false;
        }
        exports.activeLoader = undefined;
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
        if (!this.inDevMode)
            return;
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
    static loadRoute(routeData) {
        if (!exports.activeLoader) {
            throw new FatalLoaderError(false, "Attempted to lock missing activeLoader interface.\n" +
                "This would imply that a route attempted to register with a loader when that loader wasn't expecting it.");
        }
        if (Object.keys(exports.activeLoader.routes).includes(routeData.identifier)) {
            throw new FatalLoaderError(true, "UUID collision detected. This shouldn't happen. Please restart the server.\n" +
                "If you see this message more than once, something has gone VERY wrong, please contact us immediately.\n");
        }
        exports.activeLoader.routes[routeData.identifier] = routeData;
    }
    static loadController(controllerId, group, target) {
        if (!exports.activeLoader) {
            throw new FatalLoaderError(false, "Attempted to lock missing activeLoader interface.\n" +
                "This would imply that a controller attempted to register with a loader when that loader wasn't expecting it.");
        }
        if (Object.keys(exports.activeLoader.routers).includes(controllerId)) {
            throw new FatalLoaderError(true, "UUID collision detected. This shouldn't happen. Please restart the server.\n" +
                "If you see this message more than once, something has gone VERY wrong, please contact us immediately.\n");
        }
        // The routing prefix to prepend to each route belonging to this controller.
        const prefix = `/${group.map(item => item.replace(/^\/|\/$/g, '')).join('/')}`;
        const controllerRouter = new KoaRouter({ prefix });
        for (const route of Object.values(exports.activeLoader.routes).filter(route => route.controller === controllerId)) {
            let routePath = route.path.replace(/\/$/g, '');
            if (!routePath.startsWith('/'))
                routePath = `/${routePath}`;
            if (prefix === '/' && routePath.startsWith('/'))
                routePath = routePath.substring(1);
            // @ts-ignore
            const registerKoaRoute = controllerRouter[route.method.toLowerCase()];
            registerKoaRoute.call(controllerRouter, route.identifier, routePath, ...route.middleware, (...args) => route.handler.call(target.__cinnamonInstance, ...args));
        }
        exports.activeLoader.routers[controllerId] = controllerRouter;
        target._loaderActivatedController = true;
        //////////////////////// (sanitization checks)
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
        if (Object.keys(exports.activeLoader.routers).length > exports.activeLoader.trackedControllers.length) {
            throw new FatalLoaderError(true, "Cinnamon has detected a mismatch between the number of per-controller routers and the number of\n" +
                "controllers.\n\n" +
                "This would typically indicate that you have imported a Cinnamon controller in another Cinnamon\n" +
                "controller, which is currently prevented.\n\n" +
                "EXCEPT FOR unforeseen circumstances, doing this would indicate bad code structuring or design,\n" +
                "however IF you are receiving this error for unrelated reasons – OR you believe you have a good\n" +
                "reason for allowing this, please open an issue ticket on the Cinnamon project repository.\n\n" +
                "(Apollo Software only): please consider opening an issue with the Internal Projects team.\n" +
                "https://github.com/apollosoftwarexyz/cinnamon/issues/new\n");
        }
    }
    static loadMiddleware(routeId, fn) {
        if (!exports.activeLoader) {
            throw new FatalLoaderError(false, "Attempted to lock missing activeLoader interface.\n" +
                "This would imply that a controller attempted to register with a loader when that loader wasn't expecting it.");
        }
        if (!exports.activeLoader.routes[routeId]) {
            throw new Error("Attempted to register middleware for invalid route.");
        }
        exports.activeLoader.routes[routeId].middleware.push(fn);
    }
    /**********************************************************************/
    doRequire(request, caller) {
        if (!caller)
            caller = require.main;
        return this.BuiltinModuleAPI.require.call(caller, request);
    }
    hotRequire(request, caller) {
        if (!caller)
            caller = require.main;
        const exports = this.BuiltinModuleAPI.require.call(caller, request);
        const controller = this.trackedControllers.find(controller => controller.path === request);
        let modulePath;
        try {
            // @ts-ignore
            modulePath = Module._resolveFilename(request, caller);
        }
        catch (ex) {
            // Error whilst resolving module.
            return exports;
        }
        // Ensure that we only patch our controller files.
        if (!controller)
            return exports;
        if (modulePath) {
            delete require.cache[modulePath];
        }
        return exports;
    }
    /**
     * Registers all Controllers' and Middlewares' route with Koa.
     * @private
     */
    async hookWithKoa() {
        const routers = this.routers;
        await this.framework.triggerPluginHook('beforeRegisterControllers');
        // Register the error handler. We do this after 'beforeRegisterControllers' to allow plugins to get
        // priority when they work with the error handler.
        this.server.use(async (ctx, next) => {
            try {
                await next();
            }
            catch (err) {
                err.status = err.statusCode || err.status || 500;
                ctx.status = err.status;
                ctx.response.headers['content-type'] = "text/plain";
                ctx.body = 'An unexpected error occurred.';
                if (this.inDevMode) {
                    ctx.body += "\n\nThe following is being displayed because you're in development mode:\n" + err;
                }
                console.error("");
                console.error(chalk.red(err.stack));
                console.error("");
            }
        });
        // Register lib/ functions on the request context.
        this.server.use(async (ctx, next) => {
            ctx.sendFile = (path, options) => (0, files_1.default)(ctx, path, options);
            return await next();
        });
        // If the database has been initialized, register the middleware with Koa to create a new request context
        // for each request and register a middleware to add an entity manager to the context.
        if (this.framework.hasModule(database_1.DatabaseModuleStub.prototype) &&
            this.framework.getModule(database_1.DatabaseModuleStub.prototype).isInitialized) {
            // Create request context.
            this.server.use((ctx, next) => this.framework
                .getModule(database_1.DatabaseModuleStub.prototype)
                .requestContext
                .createAsync(this.framework.getModule(database_1.DatabaseModuleStub.prototype).em, next));
            // Add entity manager to context.
            this.server.use(async (ctx, next) => {
                ctx.getEntityManager = () => this.framework
                    .getModule(database_1.DatabaseModuleStub.prototype)
                    .requestContext.getEntityManager();
                return await next();
            });
        }
        else {
            this.server.use((ctx, next) => {
                ctx.getEntityManager = () => {
                    if (!this.framework.hasModule(database_1.DatabaseModuleStub.prototype)) {
                        throw new base_1.MissingModuleError("@apollosoftwarexyz/cinnamon-database");
                    }
                    else {
                        throw new Error("The database module is present but has not been initialized, so you cannot use ctx.getEntityManager.\nPlease ensure your database configuration is correct!\n");
                    }
                };
                return next();
            });
        }
        // Register a middleware to check if the body attribute on the context is usable (because the body
        // middleware has to be registered for it to be used.)
        this.server.use(async (ctx, next) => {
            (() => {
                let bodyValue;
                Object.defineProperty(ctx.request, 'body', {
                    get: () => {
                        if (!bodyValue)
                            throw new Error("You must use the body middleware to access the request body.\n" +
                                "Annotate your request handler (route) with:\n\n" +
                                "@Middleware(Body())");
                        return bodyValue;
                    },
                    set: function (value) {
                        bodyValue = value;
                    }
                });
            })();
            return await next();
        });
        /*
        Register a middleware on the Koa instance that loops through all the loaded
        middleware in this loader instance and executes them.
         */
        this.server.use(co_1.default.wrap(function* (ctx, next) {
            for (const handler of Object.values(routers)) {
                yield handler.routes()(ctx, async () => { });
                yield handler.allowedMethods()(ctx, async () => { });
            }
            yield next();
        }));
        await this.framework.triggerPluginHook('afterRegisterControllers');
        const self = this;
        this.server.use(co_1.default.wrap(function* (ctx, next) {
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
            const statusCode = ctx.status;
            // If it's not a server error status (>= 500) and logging is disabled,
            // don't log.
            if (!self.owner.isLoggingEnabled && statusCode < 500)
                return;
            // Determine status code decoration.
            let status = `[${statusCode}]`;
            if (statusCode >= 100 && statusCode < 200)
                status = chalk.cyanBright(status);
            else if (statusCode >= 200 && statusCode < 300)
                status = chalk.greenBright(status);
            else if (statusCode >= 300 && statusCode < 400)
                status = chalk.blueBright(status);
            else if (statusCode >= 400 && statusCode < 500)
                status = chalk.redBright(status);
            else if (statusCode >= 500)
                status = chalk.bgRedBright(status);
            if (statusCode < 400)
                self.owner.logger.debug(`${status} ${ctx.method} ${ctx.path} (${responseTimeMs}ms) - ${ctx.headers['user-agent']}`);
            else
                self.owner.logger.error(`${status} ${ctx.method} ${ctx.path} (${responseTimeMs}ms) - ${ctx.headers['user-agent']}`);
        }));
    }
    unhookWithKoa() {
        // Clears all of Koa's middleware, by emptying the middleware list on the underlying
        // Koa application server.
        this.server.middleware = [];
    }
}
exports.default = Loader;
class FatalLoaderError extends Error {
    /**
     * Set this to true if the error was not triggered by a specific controller,
     * to ensure that the loader does not inject the currently processing
     * controller into the error message.
     */
    isControllerAgnostic;
    constructor(controllerAgnostic, message) {
        super(message);
        this.isControllerAgnostic = controllerAgnostic ?? false;
    }
}
