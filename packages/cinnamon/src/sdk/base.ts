import type Cinnamon from '../core';

/**
 * A general unimplemented error for use within Cinnamon's SDK
 * in abstract classes.
 */
export class UnimplementedError extends Error {
    constructor(message?: string) {
        super(message);
        this.message = `Not yet implemented${message ? `: ${message}` : ''}`;
    }
}

/**
 * A general missing module error for use within Cinnamon's SDK
 * to indicate that a module that should have been installed, has
 * not been installed.
 */
export class MissingModuleError extends UnimplementedError {
    constructor(message?: string, moduleName?: string) {
        super(message);
        this.message = `Missing module${message ? `: ${message}` : ''}`;
        if (moduleName) this.message += `\nPlease install ${moduleName}.`;
    }
}

/**
 * Handles storage and manipulation of objects common to any Cinnamon
 * SDK extension - be it a module or a plugin.
 *
 * @category Core
 * @Core
 */
export abstract class CinnamonSdkBase {

    protected readonly framework: Cinnamon;

    /**
     * Used to initialize a Cinnamon extension. This is a starting point for both
     * Cinnamon modules and Cinnamon plugins despite their key differences.
     *
     * The framework instance is saved, to ensure the extension operates on the
     * Cinnamon instance that registered it. It also ensures the framework is
     * accessed in a uniform manner.
     *
     * @param framework The framework to register the extension with.
     */
    protected constructor(framework: Cinnamon) {
        this.framework = framework;
    }

}
