"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinnamonSdkBase = exports.MissingModuleError = exports.UnimplementedError = void 0;
/**
 * A general unimplemented error for use within Cinnamon's SDK
 * in abstract classes.
 */
class UnimplementedError extends Error {
    constructor(message) {
        super(message);
        this.message = `Not yet implemented${message ? `: ${message}` : ''}`;
    }
}
exports.UnimplementedError = UnimplementedError;
/**
 * A general missing module error for use within Cinnamon's SDK
 * to indicate that a module that should have been installed, has
 * not been installed.
 */
class MissingModuleError extends UnimplementedError {
    constructor(message, moduleName) {
        super(message);
        this.message = `Missing module${message ? `: ${message}` : ''}`;
        if (moduleName)
            this.message += `\nPlease install ${moduleName}.`;
    }
}
exports.MissingModuleError = MissingModuleError;
/**
 * Handles storage and manipulation of objects common to any Cinnamon
 * SDK extension - be it a module or a plugin.
 *
 * @category Core
 * @Core
 */
class CinnamonSdkBase {
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
    constructor(framework) {
        this.framework = framework;
    }
}
exports.CinnamonSdkBase = CinnamonSdkBase;
