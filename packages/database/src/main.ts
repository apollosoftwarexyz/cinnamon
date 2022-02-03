import Cinnamon from "@apollosoftwarexyz/cinnamon-core";
import { CinnamonModule } from "@apollosoftwarexyz/cinnamon-sdk";

export type CinnamonDatabaseConfiguration = {
    /**
     * Whether the database module should be enabled.
     */
    enabled: boolean;

    /**
     * Whether the framework should be terminated if Cinnamon fails to connect to the database server.
     */
    terminateOnInitError?: boolean;
}

export default class Database extends CinnamonModule {

    private readonly modelsPath: string;

    constructor(framework: Cinnamon, modelsPath: string) {
        super(framework);
        this.modelsPath = modelsPath;
    }

    public async initialize(databaseConfig: CinnamonDatabaseConfiguration) {

    }

    /**
     * Opens the connection to the database server.
     * If the database is not initialized, not enabled, or the configuration could not be resolved,
     * this method does nothing.
     */
    public async connect() {

    }

    /**
     * Closes the connection to the database server.
     * If force is set to true, no attempt is made to process pending requests or clean up
     * before disconnecting. This is useful if the server is closing because of an error.
     * @param force Whether to attempt to 'clean up' before terminating the connection.
     */
    public async terminate(force: boolean = false) {

    }

}
