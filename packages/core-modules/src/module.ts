import Cinnamon from "@apollosoftwarexyz/cinnamon-core";

/**
 * @category Core
 * @Core
 */
export default class CinnamonModule {

    protected readonly framework: Cinnamon;

    /**
     * Initializes a default CinnamonModule.
     * @param framework
     */
    constructor(framework: Cinnamon) {
        this.framework = framework;
    }

}