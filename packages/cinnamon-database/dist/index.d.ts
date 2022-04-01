import { MikroORM, EntityManager, Configuration } from "@mikro-orm/core";
import type Cinnamon from "@apollosoftwarexyz/cinnamon";
import { LoggerModule, CinnamonModule } from "@apollosoftwarexyz/cinnamon";
export declare type CinnamonDatabaseConfiguration = {
    /**
     * Whether the database module should be enabled.
     */
    enabled: boolean;
    /**
     * The database name on the database server.
     */
    database: string;
    /**
     * Whether the framework should be terminated if Cinnamon fails to connect to the database server.
     */
    terminateOnInitError?: boolean;
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
    type: Exclude<keyof typeof Configuration.PLATFORMS, "mongo">;
    /**
     * The hostname for the database server.
     * This should not include protocol or port. It is **not** a connection URL.
     */
    host: string;
    /**
     * The port for the database server.
     * For reference, common defaults are:
     * - MySQL: 3306
     * - PostgreSQL: 5432
     */
    port: number;
    /**
     * The database username.
     * If both username and password are left empty or not set, it will be assumed that the database does not require
     * authentication.
     */
    username?: string;
    /**
     * The database password.
     * If both username and password are left empty or not set, it will be assumed that the database does not require
     * authentication.
     */
    password?: string;
});
/**
 * @category Core Modules
 * @CoreModule
 */
export default class DatabaseModule extends CinnamonModule {
    private _underlyingOrmConfig;
    /**
     * Returns the ORM configuration as it would be passed to Mikro-ORM in the
     * database module.
     */
    get ormConfig(): any;
    underlyingOrm?: MikroORM;
    private readonly modelsPath;
    /**
     * @CoreModule
     * Initializes Cinnamon's Database & ORM module.
     *
     * @param framework The Cinnamon Framework instance.
     * @param modelsPath The path to the models directory.
     * @private
     */
    constructor(framework: Cinnamon, modelsPath: string);
    get logger(): LoggerModule;
    /**
     * Check if the underlying ORM engine (MikroORM) has been initialized yet.
     * Will return true if it has, or false if it hasn't.
     */
    get isInitialized(): boolean;
    get entityManager(): EntityManager;
    get em(): EntityManager;
    initialize(databaseConfig: CinnamonDatabaseConfiguration): Promise<void>;
    /**
     * Open the connection to the database server.
     * If the database is not initialized or the configuration could not be resolved,
     * this method does nothing.
     */
    connect(): Promise<void>;
    terminate(force?: boolean): Promise<void>;
}
