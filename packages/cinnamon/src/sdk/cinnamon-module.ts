import type Cinnamon from '../core';
import { CinnamonSdkBase, UnimplementedError } from './base';

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

    public terminate(inErrorState: boolean) {}

}

export abstract class CinnamonOptionalCoreModuleStub extends CinnamonModule {

    /**
     * Whether this class is a stub.
     */
    get __isStub() : boolean {
        return true;
    }

    /**
     * The class constructor name of the class that this class is a stub for.
     */
    get __stubIdentifier() : string {
        throw new UnimplementedError('You must override __stubIdentifier for CinnamonOptionalCoreModuleStub.');
    }

    /**
     * The npm package name of the module that this class is a stub for.
     */
    get __stubForModule() : string | undefined {
        throw new UnimplementedError('You must override __stubForModule for CinnamonOptionalCoreModuleStub.');
    }

}

export abstract class CinnamonOptionalCoreModule extends CinnamonOptionalCoreModuleStub {

    get __isStub() {
        return false;
    }

    get __stubIdentifier() {
        return this.constructor.name;
    }

    get __stubForModule() {
        return undefined;
    }

}
