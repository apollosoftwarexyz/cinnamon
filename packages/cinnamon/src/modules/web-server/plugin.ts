/**
 * For plugins that extend the functionality of the Cinnamon
 * WebServer module (e.g., by registering middleware) you
 * should implement this module.
 *
 * @deprecated - Use {@link CinnamonHookConsumer} instead. This interface
 *               will be removed in v0.3.0.
 *
 *               This interface is empty and can just be removed from your
 *               plugin and replaced with {@link CinnamonHookConsumer}.
 */
export interface CinnamonWebServerModulePlugin {}
