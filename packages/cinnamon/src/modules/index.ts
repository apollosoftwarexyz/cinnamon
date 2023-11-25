import { CinnamonModuleBase, moduleIsStub } from '../sdk/cinnamon-module';
import { MissingModuleError } from '../sdk/base';

export interface CinnamonModuleRegistry {

    /**
     * Checks if the specified module is registered in the framework based on its type.
     * If it is, the module is returned, otherwise false is returned.
     *
     * @param moduleType The module type (i.e. typeof MyModule)
     */
    hasModule<T extends CinnamonModuleBase>(moduleType: T) : T | boolean;

    /**
     * Gets the module if it is registered in the framework based on its type.
     * If it is not registered, an exception is thrown.
     *
     * @param moduleType The module type (i.e. typeof MyModule)
     * @see getModuleIfExists
     */
    getModule<T extends CinnamonModuleBase>(moduleType: T) : T;

    /**
     * Registers the specified module.
     * If it has already been registered in the framework, the old module reference
     * will be overwritten with the new one.
     *
     * @param module The module instance to register.
     */
    registerModule<T extends CinnamonModuleBase>(module: T) : void;

    /**
     * Unregisters the specified module.
     * If the module was not already registered in the framework, this method
     * is a no-op.
     *
     * @param module The module instance to unregister.
     * @returns True if the module was unregistered, false if it was not
     * registered to begin with.
     */
    unregisterModule<T extends CinnamonModuleBase>(module: T) : boolean;

}

export type CinnamonModuleRegistryAccess = Omit<CinnamonModuleRegistry, 'registerModule' | 'unregisterModule'>;

export class _CinnamonModuleRegistryImpl implements CinnamonModuleRegistry {
    private readonly modules: Map<string, Set<CinnamonModuleBase>> = new Map();

    public hasModule<T extends CinnamonModuleBase>(moduleType: T) : T | boolean {
        return this.lookupModule<T>(moduleType) !== undefined;
    }

    public getModule<T extends CinnamonModuleBase>(moduleType: T) : T {
        const module = this.lookupModule<T>(moduleType);
        if (module) return module;

        throw new MissingModuleError(moduleType.constructor.name);
    }

    public registerModule<T extends CinnamonModuleBase>(module: T) {
        const moduleName = module.constructor.name;
        if (!this.modules.has(moduleName)) this.modules.set(moduleName, new Set());

        // If another instance of the same module is already registered,
        // unregister it.
        const existingModule = this.lookupModule(module);
        if (existingModule) this.unregisterModule(existingModule);

        this.modules.get(moduleName)!.add(module);
    }

    public unregisterModule<T extends CinnamonModuleBase>(module: T) {
        return this.modules.get(module.constructor.name)!.delete(module);
    }

    /**
     * Gets the module if it is registered in the framework based on its type.
     * If it is not registered, undefined is returned.
     *
     * This is a private helper method to allow for the same logic to be used
     * in both getModule and hasModule.
     *
     * @param moduleType The module type (i.e. MyModule.prototype).
     * @private
     */
    private lookupModule<T extends CinnamonModuleBase>(moduleType: T) {
        // Look up the module (either by the identifier that the module stub
        // provides, or by the constructor name of the module itself.)
        const moduleName = (moduleType as any).__stubIdentifier
            ? (moduleType as any).__stubIdentifier
            : moduleType.constructor.name;

        // If there's no match for the name, return undefined immediately.
        if (!this.modules.has(moduleName)) return undefined;

        // Loop over each of the modules with the specified constructor name
        // and check if the module is the same as the one we're looking for.
        for (const module of this.modules.get(moduleName)!.values()) {
            // console.log(module.constructor, moduleType.constructor);
            // If the constructor matches, it's the same module class, so
            // return that module.
            if (module.constructor === moduleType.constructor) return module as T;

            // Otherwise if the module is a stub, we can return it immediately
            // as the name matches the stub identifier and there's nothing else
            // we can use to identify the module.
            if (moduleIsStub(moduleType)) return module as T;
        }

        // The module was not found.
        return undefined;
    }

    /**
     * Terminates all modules in the registry.
     *
     * @param inErrorState Whether the modules are being terminated due to an
     *                     error.
     * @private
     */
    public terminateModules(inErrorState: boolean) {
        let terminations = [];

        for (const moduleNamespace of this.modules.values()) {
            for (const module of moduleNamespace.values()) {
                terminations.push(module.terminate(inErrorState));
            }
        }

        return Promise.allSettled(terminations);
    }
}
