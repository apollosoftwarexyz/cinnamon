import Cinnamon from "@apollosoftwarexyz/cinnamon-core";
import { CinnamonSdkBase } from "./base";

/**
 * The base class for a Cinnamon module. This class is currently
 * just a proxy for the {@link CinnamonSdkBase} class, however
 * the plan is to refactor the module API to include lifecycle
 * hooks that this base class will define for modules.
 *
 * Cinnamon modules can be registered on a Cinnamon framework
 * instance with the `registerModule` method. They must be
 * registered with the framework instance to be accessed,
 * however once they have been, a Cinnamon module can be
 * accessed as follows:
 * ```
 * framework.getModule<MyModule>(MyModule.prototype);
 * ```
 * (where `MyModule` is your module class that extends
 * CinnamonModule).
 *
 * Cinnamon modules are intended to be further extensible
 * with Cinnamon plugins – for more information, see the
 * {@link CinnamonPlugin} class.
 *
 * @category Core
 * @Core
 */
export abstract class CinnamonModule extends CinnamonSdkBase {

    /**
     * Initializes a Cinnamon module on the given framework instance.
     *
     * @param framework The framework to register the module with.
     * @protected
     */
    protected constructor(framework: Cinnamon) {
        super(framework);
    }


}
