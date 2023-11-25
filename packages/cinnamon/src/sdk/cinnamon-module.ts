import type Cinnamon from '../core';
import { CinnamonSdkBase, UnimplementedError } from './base';
import { prototype } from '@apollosoftwarexyz/cinnamon-internals';

export enum CinnamonModuleType {
    DEFAULT = 0b000,
    CORE = 0b001,
    OPTIONAL = 0b010,
    STUB = 0b100,
    OPTIONAL_CORE_STUB = OPTIONAL | CORE | STUB,
}

export const moduleIsCore = (module: CinnamonModuleBase): boolean =>
    !!((module as any).__type & CinnamonModuleType.CORE);

export const moduleIsOptional = (module: CinnamonModuleBase): boolean =>
    !!((module as any).__type & CinnamonModuleType.OPTIONAL);

export const moduleIsStub = (module: CinnamonModuleBase): boolean =>
    !!((module as any).__type & CinnamonModuleType.STUB);

export const moduleIsOptionalCoreStub = (module: CinnamonModuleBase): boolean =>
    !!((module as any).__type & CinnamonModuleType.OPTIONAL_CORE_STUB);


/** @see {CinnamonModule} */
export abstract class CinnamonModuleBase extends CinnamonSdkBase {

    /**
     * The type of the module.
     * @private
     */
    @prototype(CinnamonModuleType.DEFAULT)
    protected readonly __type: CinnamonModuleType = undefined;

    /**
     * Initializes a Cinnamon module on the given framework instance.
     *
     * @param framework The framework to register the module with.
     * @protected
     */
    protected constructor(framework: Cinnamon) {
        super(framework);
    }

    /**
     * Initializes the module.
     * Use this method to perform any initialization logic that your module
     * requires. This method is called by the framework when the module is
     * registered.
     *
     * Unlike with plugins, this does not return a boolean value indicating
     * whether the module initialized successfully. If the module fails to
     * initialize, the module should use its discretion to determine whether
     * to shut down the entire framework or continue running in a degraded
     * state.
     *
     * Modules provide essential functionality to the framework, and as such
     * should not be allowed to fail to initialize unless the framework and
     * any potential dependencies of the module will be able to continue
     * with the module in a degraded state.
     */
    public abstract initialize(): Promise<void>;

    /**
     * Terminates the module.
     * @param inErrorState Whether the module is terminating due to an error.
     */
    public abstract terminate(inErrorState: boolean): Promise<void>;

}

/**
 * See {@link CinnamonModule}.
 *
 * This just omits the logger property as it doesn't make sense for
 * a logger module to have a logger.
 *
 * Logger modules can extend this class to provide logging services to the
 * framework.
 *
 * @category Core
 * @Core
 */
export abstract class CinnamonLoggerModuleBase extends CinnamonModuleBase {}

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
export abstract class CinnamonModule extends CinnamonModuleBase {

    /**
     * The logger for this module.
     */
    public get logger() { return this.framework.logger; }

}

export abstract class CinnamonCoreModule extends CinnamonModule {

    /**
    * The type of the module.
    * @private
    */
    @prototype(CinnamonModuleType.CORE)
    protected readonly __type: CinnamonModuleType = undefined;

    /**
     * Initializes a Cinnamon core module on the given framework instance.
     *
     * @param framework The framework to register the module with.
     * @protected
     */
    protected constructor(framework: Cinnamon) {
        super(framework);
    }

}

export abstract class CinnamonOptionalCoreModuleStub extends CinnamonModule {

    /**
     * The type of the module.
     * @private
     */
    @prototype(CinnamonModuleType.OPTIONAL_CORE_STUB)
    protected readonly __type: CinnamonModuleType = undefined;

    /**
     * The class constructor name of the class that this class is a stub for.
     */
    protected get __stubIdentifier() : string {
        throw new UnimplementedError('You must override __stubIdentifier for CinnamonOptionalCoreModuleStub.');
    }

    /**
     * The npm package name of the module that this class is a stub for.
     */
    protected get __stubForModule() : string | undefined {
        throw new UnimplementedError('You must override __stubForModule for CinnamonOptionalCoreModuleStub.');
    }

}
