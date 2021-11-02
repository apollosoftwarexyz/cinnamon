import { MikroORM, EntityManager } from "@mikro-orm/core";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { Configuration } from "@mikro-orm/core/utils/Configuration";

import Cinnamon  from "@apollosoftwarexyz/cinnamon-core";
import { CinnamonModule } from "@apollosoftwarexyz/cinnamon-sdk";
import Logger from "@apollosoftwarexyz/cinnamon-logger";
import cinnamonInternals from "@apollosoftwarexyz/cinnamon-core-internals";

export type CinnamonDatabaseConfiguration = {
    /**
     * The database name on the database server.
     */
    database: string,

    /**
     * Whether the framework should be terminated if Cinnamon fails to connect to the database server.
     */
    terminateOnInitError?: boolean
} & ({
    /**
     * The database type.
     * https://mikro-orm.io/docs/usage-with-sql
     *
     * This must be one of the acceptable configuration platforms per Mikro-ORM:
     * - MongoDB: 'mongo'
     * - MySQL or MariaDB: 'mysql'
     * - MySQL or MariaDB: 'mariadb'
     * - PostgreSQL: 'postgresql'
     * - SQLite: 'sqlite'
     */
    type: "mongo";
    clientUrl: string;
} | {
    /**
     * The database type.
     * https://mikro-orm.io/docs/usage-with-sql
     *
     * This must be one of the acceptable configuration platforms per Mikro-ORM:
     * - MongoDB: 'mongo'
     * - MySQL or MariaDB: 'mysql'
     * - MySQL or MariaDB: 'mariadb'
     * - PostgreSQL: 'postgresql'
     * - SQLite: 'sqlite'
     */
    type: Exclude<keyof typeof Configuration.PLATFORMS, "mongo">,
    /**
     * The hostname for the database server.
     * This should not include protocol or port. It is **not** a connection URL.
     */
    host: string,
    /**
     * The port for the database server.
     * For reference, common defaults are:
     * - MySQL: 3306
     * - PostgreSQL: 5432
     */
    port: number,
    /**
     * The database username.
     * If both username and password are left empty or not set, it will be assumed that the database does not require
     * authentication.
     */
    username?: string,
    /**
     * The database password.
     * If both username and password are left empty or not set, it will be assumed that the database does not require
     * authentication.
     */
    password?: string,
});

/**
 * @category Core Modules
 * @CoreModule
 */
export default class Database extends CinnamonModule {

    private _underlyingOrmConfig: any;

    /**
     * Returns the ORM configuration as it would be passed to Mikro-ORM in the
     * database module.
     */
    get ormConfig () {
        return this._underlyingOrmConfig;
    }

    public underlyingOrm?: MikroORM;
    private readonly modelsPath: string;

    /**
     * @CoreModule
     * Initializes Cinnamon's Database & ORM module.
     *
     * @param framework The Cinnamon Framework instance.
     * @param modelsPath The path to the models directory.
     * @private
     */
    constructor(framework: Cinnamon, modelsPath: string) {
        super(framework);
        this.modelsPath = modelsPath;
    }

    public get logger() { return this.framework.getModule<Logger>(Logger.prototype); }

    /**
     * Check if the underlying ORM engine (MikroORM) has been initialized yet.
     * Will return true if it has, or false if it hasn't.
     */
    public get isInitialized(): boolean {
        return this.underlyingOrm !== undefined;
    }

    public get entityManager(): EntityManager {
        if (!this.isInitialized) {
            // @ts-ignore
            return undefined;
        }

        return this.underlyingOrm!.em;
    }

    public get em(): EntityManager {
        return this.entityManager;
    }

    public async initialize(databaseConfig: CinnamonDatabaseConfiguration) {
        if (this.isInitialized) {
            throw new Error("The database module is already initialized. You cannot initialize it again.");
        }

        this.logger.frameworkDebug("Database module is loading models now.");

        // Ensure the models directory is present.
        // We do this check in core startup, but this will ensure we're in the correct state
        // even if this module is loaded independently of the default distribution's core class.
        if (!await cinnamonInternals.fs.directoryExists(this.modelsPath)) {
            this.logger.error(`Unable to load database models due to missing controllers directory: ${cinnamonInternals.fs.toAbsolutePath(this.modelsPath)}`);

            if (databaseConfig.terminateOnInitError) await this.framework.terminate(true);
            else this.logger.error(`Database initialization halted. The database module has NOT been initialized.`);

            return;
        }

        // Validate the database configuration.
        if (
            !databaseConfig.type ||
            !databaseConfig.database ||
            (databaseConfig.type !== 'mongo' && (
                !databaseConfig.host ||
                !databaseConfig.port ||
                isNaN(databaseConfig.port)
            )) ||
            (databaseConfig.type === 'mongo' && !databaseConfig.clientUrl)
        ) {
            this.logger.error(`Invalid database configuration. For a ${databaseConfig.type ? databaseConfig.type + ' ' : ''}database, you must set at least:`);
            if (databaseConfig.type === "mongo")
                this.logger.error(`type, clientUrl`);
            else if (!!databaseConfig.type)
                this.logger.error(`type, host, port, database`);
            else {
                this.logger.error(`type = 'mongo', database and clientUrl, or`)
                this.logger.error(`type, host, port, database`);
            }
            this.logger.error(`For more information, please refer to the Mikro-ORM manual:`);
            this.logger.error(`https://mikro-orm.io/docs/`);

            if (databaseConfig.terminateOnInitError) await this.framework.terminate(true);
            else this.logger.error(`Database initialization halted. The database module has NOT been initialized.`);

            return;
        }

        // Validate the specified database type.
        let validateDatabaseTypes: string[] = Object.keys(Configuration.PLATFORMS);
        if (!validateDatabaseTypes.includes(databaseConfig.type)) {
            this.logger.error(`Invalid database type specified: ${databaseConfig.type ?? '<none>'}. Is there a typo?`);
            this.logger.error(`Please check your project's cinnamon.toml file.`);
            this.logger.error(`Valid database types are: ${validateDatabaseTypes}`)

            if (databaseConfig.terminateOnInitError) await this.framework.terminate(true);
            else this.logger.error(`Database initialization halted. The database module has NOT been initialized.`);

            return;
        }

        try {
            let hasCredentials: boolean = databaseConfig.type !== 'mongo' && (databaseConfig.username != null && databaseConfig.password != null);

            this._underlyingOrmConfig = {
                metadataProvider: TsMorphMetadataProvider,
                type: databaseConfig.type as keyof typeof Configuration.PLATFORMS,
                entities: [
                    `${this.modelsPath}/**/*.js`,
                    `${this.modelsPath}/**/*.ts`
                ],
                entitiesTs: [`${this.modelsPath}/**/*.ts`],
                dbName: databaseConfig.database,
                ...(databaseConfig.type != "mongo" ? {
                    host: databaseConfig.host,
                    port: databaseConfig.port,
                    user: hasCredentials ? databaseConfig.username : undefined,
                    password: hasCredentials ? databaseConfig.password : undefined
                } : {
                    clientUrl: databaseConfig.clientUrl
                })
            };
        } catch(ex) {
            this.logger.error(`Failed to initialize MikroORM (ORM engine).`);
            console.error(ex);

            if (databaseConfig.terminateOnInitError) await this.framework.terminate(true);
            else this.logger.error(`Database initialization halted. The database module has NOT been initialized.`);
        }
    }

    /**
     * Open the connection to the database server.
     * If the database is not initialized or the configuration could not be resolved,
     * this method does nothing.
     */
    public async connect() {
        if (!this._underlyingOrmConfig) return;
        this.underlyingOrm = await MikroORM.init(this._underlyingOrmConfig);
    }

}
