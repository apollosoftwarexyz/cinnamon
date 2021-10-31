import Cinnamon  from "@apollosoftwarexyz/cinnamon-core";
import { $, ValidationSchema } from "@apollosoftwarexyz/cinnamon-validator";

import cinnamonInternals from "@apollosoftwarexyz/cinnamon-core-internals";
import { CinnamonModule } from "@apollosoftwarexyz/cinnamon-core-modules";

/**
 * @category Core Modules
 * @CoreModule
 */
export default class Config extends CinnamonModule {

    private appConfig?: any;

    /**
     * Whether or not validation failed when the config was loaded.
     *
     * If no validator is set, this will naturally always return false (as no
     * validation occurred).
     *
     * If the framework is set to halt when the app configuration validation
     * fails this value will, of course, be useless as the app won't be running
     * to read it in the case where it's true.
     */
    public readonly didFailValidation: boolean;

    /**
     * Returns true if the app configuration section is present (it may still
     * be empty, this just guarantees that it's not null or undefined.) False
     * if it isn't - in other words if it *is* null or undefined.
     *
     * This will also return false if validation failed (as the module will
     * refuse to load an invalid config, instead setting the app configuration
     * to null.)
     *
     * @return Whether the app config is present and loaded in the config
     * module.
     */
    get hasAppConfig(): boolean {
        return this.appConfig !== null && this.appConfig !== undefined;
    }

    /**
     * @CoreModule
     * Initializes a Cinnamon Framework configuration module.
     * This module is responsible for holding application configuration for the
     * current framework instance.
     *
     * @param framework The Cinnamon framework instance.
     * @param appConfig The app table of the cinnamon.toml configuration file.
     * @param appConfigSchema A schema validator for the app configuration,
     * this would usually be passed into the framework as a Cinnamon
     * initialization option.
     */
    constructor(framework: Cinnamon, appConfig?: any, appConfigSchema?: ValidationSchema) {
        super(framework);

        // If the validation schema is present and validation fails, set our
        // config to null to indicate there is no valid configuration present.
        if (appConfigSchema && !$(appConfigSchema).validate(appConfig)) {
            this.didFailValidation = true;
            this.appConfig = null;
        // Otherwise, set the app config to the value provided.
        } else {
            this.didFailValidation = false;
            this.appConfig = appConfig;
        }
    }

    /**
     * Retrieves a value from the Cinnamon app configuration table. This can
     * retrieve nested values using a period (.) to delimit a nested object in
     * the key.
     *
     * @param key The key of the value to look up in the app configuration.
     * @return {T} value - The retrieved value from the configuration file.
     */
    public get<T = any>(key: string) : T {
        if (!this.appConfig) throw new Error(
            "There is no app configuration loaded.\n" +
            "You can initialize a runtime app configuration by calling set to add a key to a new, empty, configuration.\n" +
            "Alternatively, ensure that no validation errors occurred whilst loading the configuration *and* that you have a loadable app configuration in your cinnamon.toml."
        );

        const result = cinnamonInternals.data.resolveObjectDeep(
            key, this.appConfig
        );

        if (result === undefined) throw new Error('No object located at the specified key.');
        return result as T;
    }

    /**
     * Sets a value in the Cinnamon app configuration table. As with get, this
     * can set nested values with the key using a period (.) to delimit a nested
     * object.
     *
     * Before writing the key, the value will be checked to ensure it can be
     * properly serialized and de-serialized. If it cannot, (e.g., because it is
     * a runtime object), the operation will immediately fail and the app
     * configuration object will not be touched.
     *
     * If the configuration wasn't initialized, this will initialize an empty
     * configuration before attempting to set the key.
     *
     * If the key denotes nested objects that aren't initialized, they will
     * first be initialized before the value is set.
     *
     * @param key The key of the value to update in the app configuration.
     * @param value The value to update the property at `key` to.
     */
    public set<T>(key: string, value: T) : void {
        const jsonValue = JSON.stringify(value);
        if (JSON.parse(jsonValue) !== value) {
            throw new Error("This type of value cannot be stored.");
        }

        if (!this.appConfig) this.appConfig = {};

        cinnamonInternals.data.setObjectDeep(key, value, this.appConfig);
    }

}
