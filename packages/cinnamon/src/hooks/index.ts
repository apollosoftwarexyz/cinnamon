import { ArgumentOrStateError } from '@apollosoftwarexyz/cinnamon-internals';

/**
 * The set of all hooks that can be used by plugins and used or triggered by
 * modules and Cinnamon's core.
 *
 * @see CinnamonHookRegistry
 */
export interface CinnamonHooks {

    /**
     * Triggered after Cinnamon's core and all modules have completely
     * initialized, but before the web server module has started and begun
     * accepting requests.
     */
    onStart(): Promise<void>;

    /**
     * Triggered after Cinnamon has completely initialized and the web server
     * module has started and begun accepting requests.
     *
     * Use this method to access the underlying web server instance, if
     * necessary (e.g., to register additional routes or protocols such as
     * websockets).
     *
     * This hook is only called if `autostartServices` is set to true in the
     * configuration file (so it will be called on a normal startup, but not
     * when Cinnamon is booted for the purpose of running a CLI command).
     */
    afterStart(): Promise<void>;

    /**
     * Triggered immediately before the controllers are registered on
     * the underling web server. This is useful for middleware that
     * prepares the context for routes (e.g., by injecting methods or
     * variables into them or preparing/rearranging/parsing request data
     * for the controllers.)
     *
     * This hook triggers AFTER the default error handlers. If you want
     * to override them, you will need to use {@link beforeRegisterErrors}.
     */
    beforeRegisterErrors(): Promise<void>;

    /**
     * Triggered after {@link beforeRegisterErrors} but before any controllers
     * are registered, and before {@link beforeRegisterControllers}.
     *
     * This is useful for middleware that prepares the context for routes
     * (e.g., by injecting methods or variables into them or preparing/
     * rearranging/parsing request data for the controllers.)
     *
     * If you want to alter the context, you should do so in this hook as it
     * means that both controllers and any users of the
     * {@link beforeRegisterControllers} hook will have access to the altered
     * context.
     */
    prepareContext(): Promise<void>;

    /**
     * Triggered immediately after the controllers are registered on
     * the underling web server. This is useful for middleware that
     * modifies the response after the controllers have processed the
     * requests (e.g., by modifying the response data or logging response
     * status or data.).
     *
     * @see afterRegisterControllers
     */
    beforeRegisterControllers(): Promise<void>;

    /**
     * Triggered before the error handler middleware is registered on the
     * underlying web server. This is useful if you want to override the
     * built-in error handler with your plugin.
     *
     * @see beforeRegisterControllers
     */
    afterRegisterControllers(): Promise<void>;

}

/**
 * An individual hook name that can be registered.
 */
export type CinnamonHook = keyof CinnamonHooks;

/**
 * A consumer of hooks.
 * You can implement this interface for correctness when using hooks, but it
 * is not required.
 *
 * Note that only plugins automatically have their hooks registered. If you
 * are not developing a plugin, you will need to register your hooks manually
 * with {@link Cinnamon.useHook}.
 */
export type CinnamonHookConsumer = Partial<CinnamonHooks>;

// Utility types for async hooks.
type AsyncFunction<T> = T extends(...args: any[]) => Promise<any> ? T : never;
export type AsyncCinnamonHooks = {
    [K in keyof CinnamonHooks]: AsyncFunction<CinnamonHooks[K]>;
}
export type AsyncCinnamonHook = keyof AsyncCinnamonHooks;

export interface CinnamonHookRegistry {

    /**
     * Returns the set of all hooks currently registered, including those
     * registered by Cinnamon's core.
     *
     * That is, the set of all valid hooks that can be used by plugins and
     * modules.
     */
    get registeredHooks(): Set<CinnamonHook>;

    /**
     * Register a hook.
     * This can be done within a module to allow other modules or plugins to
     * hook into that module's lifecycle.
     *
     * If the hook already exists, this method is a no-op.
     *
     * Modules may trigger their hooks with {@link triggerHook} or
     * {@link triggerAsyncHook} (if they would like to wait for all listeners
     * to complete before continuing).
     *
     * Modules and plugins that wish to use the hook can register a listener
     * with {@link useHook} and can remove it with {@link cancelHook}.
     *
     * Note that plugins automatically have their handlers registered (if they
     * are present in the plugin when it is loaded). Additional handlers may be
     * dynamically added or removed by the plugin with {@link useHook} and
     * {@link cancelHook}.
     *
     * @param hook The name of the hook to register.
     */
    registerHook<K extends CinnamonHook>(hook: K): void;

    /**
     * Unregisters a hook.
     * This can be done within a module to prevent other modules or plugins
     * from hooking into that module's lifecycle and to automatically dispose
     * any listeners that have been registered for the hook.
     *
     * If the hook was registered by Cinnamon's core, this method will throw an
     * error. This is to prevent modules from unregistering hooks that are
     * required for Cinnamon to function.
     *
     * Additionally, if the hook was not registered, this method is a no-op.
     *
     * You probably won't ever need to use this. There's no need to do this on
     * module termination unless your module is terminated separately from the
     * rest of Cinnamon - as when the framework re-initializes, or terminates,
     * it will automatically unregister all hooks by just disposing the hook
     * registry.
     *
     * (Modules shouldn't be terminated separately from the rest of Cinnamon
     * though, as plugins and other modules may rely on that module's
     * functionality.)
     *
     * @param hook The name of the hook to unregister.
     */
    unregisterHook<K extends CinnamonHook>(hook: K): void;

    /**
     * Register a listener for a hook.
     * If the listener has already been registered, this method is a no-op.
     *
     * @param hook The hook to register the listener for.
     * @param callback The callback to execute when the hook is triggered.
     */
    useHook<K extends CinnamonHook>(hook: K, callback: CinnamonHooks[K]): void;

    /**
     * Cancel a listener for a hook.
     * If the listener has not been registered, this method is a no-op.
     *
     * @param hook The hook to cancel the listener for.
     * @param callback The callback to cancel.
     */
    cancelHook<K extends CinnamonHook>(hook: K, callback: CinnamonHooks[K]): void;

    /**
     * Trigger a hook.
     * If no listeners are registered for the hook, this method is a no-op.
     *
     * @param hook The hook to trigger.
     * @param args The arguments to pass to the hook listeners.
     */
    triggerHook<K extends CinnamonHook>(hook: K, ...args: Parameters<CinnamonHooks[K]>): void;

    /**
     * Trigger a hook and wait for all listeners to complete.
     * If no listeners are registered for the hook, this method is a no-op.
     *
     * @param hook The hook to trigger.
     * @param args The arguments to pass to the hook listeners.
     */
    triggerAsyncHook<K extends AsyncCinnamonHook>(hook: K, ...args: Parameters<CinnamonHooks[K]>): Promise<void>;

}

export class _CinnamonHookRegistryImpl implements CinnamonHookRegistry {

    // Populated in the constructor to be the hooks at the time of
    // construction => the set of hooks from within the core framework.
    private readonly frameworkHooks: Set<CinnamonHook>;
    private readonly hooks: Set<CinnamonHook> = new Set([
        'onStart',
        'afterStart',
        'prepareContext',
        'beforeRegisterErrors',
        'beforeRegisterControllers',
        'afterRegisterControllers'
    ]);

    public get registeredHooks(): Set<CinnamonHook> {
        return new Set(this.hooks);
    }

    private readonly handlers: Partial<{
        [K in CinnamonHook]: Set<CallableFunction>;
    }> = {};

    constructor() {
        this.frameworkHooks = new Set(this.hooks);
    }

    registerHook<K extends CinnamonHook>(hook: K) {
        this.hooks.add(hook);
    }

    unregisterHook<K extends CinnamonHook>(hook: K) {
        if (this.frameworkHooks.has(hook)) {
            throw new ArgumentOrStateError("Cannot unregister a hook that was registered by Cinnamon's core.");
        }

        this.hooks.delete(hook);
        delete this.handlers[hook];
    }

    public useHook<K extends CinnamonHook>(hook: K, callback: CinnamonHooks[K]): void {
        this.assertHookRegistered(hook);
        if (!this.handlers[hook]) this.handlers[hook] = new Set();
        this.handlers[hook]!.add(callback);
    }

    public cancelHook<K extends CinnamonHook>(hook: K, callback: CinnamonHooks[K]): void {
        this.assertHookRegistered(hook);
        if (!this.handlers[hook]) return;

        this.handlers[hook]!.delete(callback);
    }

    public triggerHook<K extends CinnamonHook>(hook: K, ...args: Parameters<CinnamonHooks[K]>): void {
        this.assertHookRegistered(hook);
        if (!this.handlers[hook]) return;

        this.handlers[hook]!.forEach(callback => callback(...args));
    }

    public async triggerAsyncHook<K extends AsyncCinnamonHook>(hook: K, ...args: Parameters<AsyncCinnamonHooks[K]>): Promise<void> {
        this.assertHookRegistered(hook);
        if (!this.handlers[hook]) return;

        let pending = [];
        for (const trigger of this.handlers[hook].values()) {
            pending.push(trigger(...args));
        }

        await Promise.allSettled(pending);
    }

    private assertHookRegistered<K extends CinnamonHook>(hook: K) {
        if (!this.hooks.has(hook)) {
            throw new ArgumentOrStateError(`The hook ${hook} has not been registered.`);
        }
    }

}
