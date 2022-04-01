"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinnamonOptionalCoreModule = exports.CinnamonOptionalCoreModuleStub = exports.CinnamonModule = void 0;
const base_1 = require("./base");
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
class CinnamonModule extends base_1.CinnamonSdkBase {
    /**
     * Initializes a Cinnamon module on the given framework instance.
     *
     * @param framework The framework to register the module with.
     * @protected
     */
    constructor(framework) {
        super(framework);
    }
    terminate(inErrorState) { }
}
exports.CinnamonModule = CinnamonModule;
class CinnamonOptionalCoreModuleStub extends CinnamonModule {
    /**
     * Whether this class is a stub.
     */
    get __isStub() {
        return true;
    }
    /**
     * The class constructor name of the class that this class is a stub for.
     */
    get __stubIdentifier() {
        throw new base_1.UnimplementedError("You must override __stubIdentifier for CinnamonOptionalCoreModuleStub.");
    }
    /**
     * The npm package name of the module that this class is a stub for.
     */
    get __stubForModule() {
        throw new base_1.UnimplementedError("You must override __stubForModule for CinnamonOptionalCoreModuleStub.");
    }
}
exports.CinnamonOptionalCoreModuleStub = CinnamonOptionalCoreModuleStub;
class CinnamonOptionalCoreModule extends CinnamonOptionalCoreModuleStub {
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
exports.CinnamonOptionalCoreModule = CinnamonOptionalCoreModule;
