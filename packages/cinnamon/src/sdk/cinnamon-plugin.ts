import type Cinnamon from "../core";
import { CinnamonSdkBase } from "./base";

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
export abstract class CinnamonPlugin extends CinnamonSdkBase {

    /**
     * The organization that publishes or maintains the package in
     * reverse domain form. (e.g., xyz.apollosoftware).
     */
    public readonly organization: string;

    /**
     * The name of the package. Can be specified manually, or will
     * default automatically to the plugin's class name.
     */
    public readonly name: string;

    /**
     * Initializes a Cinnamon plugin on the given framework instance,
     * with the specified organization and, optionally, plugin name.
     *
     * @param framework The framework to register the plugin with.
     * @param organization The organization name in reverse domain form.
     * @param name The name of the plugin. If set, replaces the automatically generated name.
     * @protected
     */
    protected constructor(framework: Cinnamon, organization: string, name?: string) {
        super(framework);
        this.organization = organization;
        this.name = name ?? new.target.name;
    }

    /**
     * The plugin identifier (organization_name/plugin_name).
     * This concatenates the organization name and plugin name with a period
     * to yield a plugin name that should, theoretically, be globally unique.
     */
    get identifier() : string {
        return `${this.organization}/${this.name}`;
    }

    /**
     * Executed as soon as Cinnamon reads its configuration file and performs
     * basic initialization.
     *
     * You should perform any basic plugin initialization, such as reading
     * configuration values here. If any configuration values are set
     * incorrectly or not set, you should return false.
     *
     * If your plugin requires no initialization at all, simply `return true`
     * from this method.
     *
     * The method should return whether or not the plugin initialized successfully,
     * if there's a possibility that it won't. If it did not initialize successfully,
     * Cinnamon will not call other event handlers on the plugin.
     *
     * @return didInitialize Whether or not the plugin initialized successfully,
     * `true` implies that it did, `false` implies that it did not. **A return
     * value of void implies that it *did* initialize successfully.**
     */
    abstract onInitialize() : Promise<boolean | void>;

    /**
     * Executed after Cinnamon's core and all modules have completely initialized,
     * but before the web server module has started and begun accepting requests.
     */
    async onStart() : Promise<void> {};

    /**
     * Executed after Cinnamon has completely initialized and the web server
     * module has started and begun accepting requests. It is unusual that
     * you would need this method, but this might be helpful for accessing
     * the current underlying HTTP server.
     */
    async afterStart() : Promise<void> {};

}
