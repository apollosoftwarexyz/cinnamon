import type Cinnamon from '../core';
import { CinnamonError } from '@apollosoftwarexyz/cinnamon-internals';

/**
 * A general unimplemented error for use within Cinnamon's SDK
 * in abstract classes.
 */
export class UnimplementedError extends CinnamonError {
    constructor(message?: string) {
        super(message);
        this.message = `Not yet implemented${message ? `: ${message}` : ''}`;
    }
}

export class MissingModuleError extends UnimplementedError {
    constructor(moduleName: string, message?: string) {
        const missingModuleMessage =
            `Missing module: ${moduleName}\n\n` +
            (message ? `${message}\n\n` : '') +
            `You have activated a feature that tried to access a Cinnamon module that is\n` +
            `not installed in your project.\n\n` +
            `To use this feature make sure that the above module is installed and active.\n\n`;

        super(missingModuleMessage);
        this.message = missingModuleMessage;
    }
}

/**
 * A general missing module error for use within Cinnamon's SDK
 * to indicate that a module that should have been installed, has
 * not been installed.
 */
export class MissingPackageError extends MissingModuleError {
    constructor(moduleName: string, packageName: string, message?: string) {
        const missingPackageMessage =
            `Missing module: ${moduleName}\n` +
            `Missing package: ${packageName}\n\n` +
            (message ? `${message}\n\n` : '') +
            `You have activated a feature from a Cinnamon module that is not installed in your project.\n` +
            `To use this feature, you must install the package that provides it: ${packageName}\n\n` +
            `You can install it with:\n\n` +
            `    yarn add ${packageName}\n\n` +
            `Or, if you are using npm:\n\n` +
            `    npm install ${packageName}\n\n`;

        super(moduleName, missingPackageMessage);
        this.message = missingPackageMessage;
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
