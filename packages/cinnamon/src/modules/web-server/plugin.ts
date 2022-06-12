/**
 * For plugins that extend the functionality of the Cinnamon
 * WebServer module (e.g., by registering middleware) you
 * should implement this module.
 */
export interface CinnamonWebServerModulePlugin {

    /**
     * Executed immediately before the controllers are registered on
     * the underling web server. This is useful for middleware that
     * prepares the context for routes (e.g., by injecting methods or
     * variables into them or preparing/rearranging/parsing request data
     * for the controllers.)
     *
     * This hook executes AFTER the default error handlers. If you want
     * to override them, you will need to use {@link beforeRegisterErrors}.
     */
    beforeRegisterControllers?: () => Promise<void>;

    /**
     * Executed immediately after the controllers are registered on
     * the underling web server. This is useful for middleware that
     * modifies the response after the controllers have processed the
     * requests (e.g., by modifying the response data or logging response
     * status or data.)
     */
    afterRegisterControllers?: () => Promise<void>;

    /**
     * Executed before the error handler middleware is registered on the
     * underlying web server. This is useful if you want to override the
     * built-in error handler with your plugin.
     *
     * @see beforeRegisterControllers
     */
    beforeRegisterErrors?: () => Promise<void>;

}
