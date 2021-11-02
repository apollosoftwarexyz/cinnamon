import Cinnamon from "@apollosoftwarexyz/cinnamon-core";

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
