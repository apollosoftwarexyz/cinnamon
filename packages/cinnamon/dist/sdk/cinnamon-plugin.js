"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinnamonPlugin = void 0;
const base_1 = require("./base");
/**
 * The base class for a Cinnamon plugin. Cinnamon plugins,
 * unlike modules, are not interacted with directly - rather
 * they just mutate existing APIs, so they are identified by
 * an organization and plugin name. As a plugin developer, you
 * are responsible for ensuring there are no collisions between
 * names and your organization domain.
 *
 * Cinnamon plugins are registered on the framework with
 * `Cinnamon.use`, they cannot be registered as modules as plugins
 * are not intended or expected to define a framework-wide module
 * interface from their base class and should not be accessed
 * directly.
 *
 * The intention behind Cinnamon plugins, is to provide a means of
 * extending Cinnamon's existing modules or core. Essentially,
 * they act as a 'mix-in'. Additionally, they may define handlers
 * for various event hooks (as defined in this class, and in any
 * extension interfaces), that the core - or even modules may
 * call.
 *
 * @category Core
 * @Core
 */
class CinnamonPlugin extends base_1.CinnamonSdkBase {
    /**
     * Initializes a Cinnamon plugin on the given framework instance,
     * with the specified organization and, optionally, plugin name.
     *
     * @param framework The framework to register the plugin with.
     * @param organization The organization name in reverse domain form.
     * @param name The name of the plugin. If set, replaces the automatically generated name.
     * @protected
     */
    constructor(framework, organization, name) {
        super(framework);
        this.organization = organization;
        this.name = name !== null && name !== void 0 ? name : new.target.name;
    }
    /**
     * The plugin identifier (organization_name/plugin_name).
     * This concatenates the organization name and plugin name with a period
     * to yield a plugin name that should, theoretically, be globally unique.
     */
    get identifier() {
        return `${this.organization}/${this.name}`;
    }
    /**
     * Executed after Cinnamon's core and all modules have completely initialized,
     * but before the web server module has started and begun accepting requests.
     */
    async onStart() { }
    ;
    /**
     * Executed after Cinnamon has completely initialized and the web server
     * module has started and begun accepting requests. It is unusual that
     * you would need this method, but this might be helpful for accessing
     * the current underlying HTTP server.
     */
    async afterStart() { }
    ;
}
exports.CinnamonPlugin = CinnamonPlugin;
