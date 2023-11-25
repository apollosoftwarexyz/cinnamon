import { MikroORM, EntityManager, Configuration, RequestContext, MetadataError } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

import type Cinnamon from '@apollosoftwarexyz/cinnamon';
import { CinnamonModule, WebServer } from '@apollosoftwarexyz/cinnamon';
import {
    directoryExists,
    errorsMatch,
    HttpError,
    ThirdPartyError,
    toAbsolutePath
} from '@apollosoftwarexyz/cinnamon-internals';

export type CinnamonDatabaseConfiguration = {

    /**
     * Whether the database module should be enabled.
     */
    enabled: boolean;

    /**
     * Whether the connection should be verified on startup. If this is set to
     * true, when the database module is initialized, the connection will be
     * checked to ensure it is valid. If it is not, the application will
     * terminate.
     */
    checked?: boolean;

    /**
     * The name of the database on the database server.
     */
    database: string;

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
    type: 'mongo';
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
    type: Exclude<keyof typeof Configuration.PLATFORMS, 'mongo'>;

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

    private _underlyingOrmConfig: any;

    /**
     * Returns the ORM configuration as it would be passed to Mikro-ORM in the
     * database module.
     */
    public get ormConfig () {
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
     * @param databaseConfig The database configuration.
     * @private
     */
    constructor(
        framework: Cinnamon,
        modelsPath: string,
        private readonly databaseConfig: CinnamonDatabaseConfiguration
    ) {
        super(framework);
        this.modelsPath = modelsPath;
    }

    /**
     * Check if the underlying ORM engine (MikroORM) has been initialized yet.
     * Will return true if it has, or false if it hasn't.
     */
    public get isInitialized() : boolean {
        return this.underlyingOrm !== undefined;
    }

    public get entityManager() : EntityManager {
        if (!this.isInitialized) {
            return undefined;
        }

        return this.underlyingOrm!.em;
    }

    get logger() {
        return this.framework.logger;
    }

    public async initialize() {

        if (this.isInitialized) {
            throw new Error('The database module is already initialized. You cannot initialize it again.');
        }

        this.logger['frameworkDebug']('Database module is loading models now.');

        // Ensure the models directory is present.
        // We do this check in core startup, but this will ensure we're in the correct state
        // even if this module is loaded independently of the default distribution's core class.
        if (!await directoryExists(this.modelsPath)) {
            this.logger.error(
                `Unable to load database models due to missing models directory: ${toAbsolutePath(this.modelsPath)}\n\n` +
                `- If you do not want to use the database module at this time, set 'framework.database.enabled' to false\n\n` +
                `  in your cinnamon.toml file.` +
                `- Otherwise, create the models directory, and add at least one model to it.\n\n`
            );
            await this.framework.terminate(true);
            return;
        }

        // Validate the database configuration.
        if (
            !this.databaseConfig.type ||
            !this.databaseConfig.database ||
            (this.databaseConfig.type !== 'mongo' && (
                !this.databaseConfig.host ||
                !this.databaseConfig.port ||
                isNaN(this.databaseConfig.port)
            )) ||
            (this.databaseConfig.type === 'mongo' && !this.databaseConfig.clientUrl)
        ) {
            let requiredProperties =
                `type = 'mongo', database and clientUrl, or\n` +
                `type, host, port, database`;

            if (this.databaseConfig.type === 'mongo')
                requiredProperties = `type, clientUrl`;
            else if (this.databaseConfig.type)
                requiredProperties = `type, host, port, database`;

            this.logger.error([
                `Invalid database configuration. For a ${this.databaseConfig.type ? this.databaseConfig.type + ' ' : ''}database, you must set at least:`,
                requiredProperties,
                `For more information, please refer to the Mikro-ORM manual:\n` +
                `https://mikro-orm.io/docs/`
            ].join('\n\n'));

            await this.framework.terminate(true);
            return;
        }

        // Validate the specified database type.
        let validateDatabaseTypes: string[] = Object.keys(Configuration.PLATFORMS);
        if (!validateDatabaseTypes.includes(this.databaseConfig.type)) {
            this.logger.error([
                `Invalid database type specified: ${this.databaseConfig.type ?? '<none>'}. Is there a typo?`,
                `Please check your project's cinnamon.toml file.`,
                `Valid database types are: ${validateDatabaseTypes}`
            ].join('\n\n'));

            await this.framework.terminate(true);
            return;
        }

        try {
            let hasCredentials: boolean = this.databaseConfig.type !== 'mongo' && (this.databaseConfig.username != null && this.databaseConfig.password != null);

            this._underlyingOrmConfig = {
                metadataProvider: TsMorphMetadataProvider,
                type: this.databaseConfig.type as keyof typeof Configuration.PLATFORMS,
                entities: [
                    `${this.modelsPath}/**/*.js`,
                    `${this.modelsPath}/**/*.ts`
                ],
                entitiesTs: [`${this.modelsPath}/**/*.ts`],
                dbName: this.databaseConfig.database,
                ...(this.databaseConfig.type != 'mongo' ? {
                    host: this.databaseConfig.host,
                    port: this.databaseConfig.port,
                    user: hasCredentials ? this.databaseConfig.username : undefined,
                    password: hasCredentials ? this.databaseConfig.password : undefined
                } : {
                    clientUrl: this.databaseConfig.clientUrl
                })
            };

            let databaseOptions = {};
            if (this._underlyingOrmConfig.type === 'mongo') {
                databaseOptions = { ensureIndexes: true };
            }

            this.underlyingOrm = await MikroORM.init({
                ...this._underlyingOrmConfig,
                ...databaseOptions,
                connect: false,
            });
        } catch(ex) {
            this.logger.error(`Failed to initialize Mikro-ORM (Database engine).`);

            if (errorsMatch(ex, MetadataError.noEntityDiscovered())) {
                this.logger.error([
                    `No entities were discovered in the models directory.`,
                    `Please ensure that you have at least one entity class defined.`,
                    `For more information, please refer to the Mikro-ORM manual:\n` +
                    `https://mikro-orm.io/docs/configuration#entity-discovery`,
                    `Note that Cinnamon automatically configures the 'metadataProvider' and 'entities'/'entitiesTs'\n` +
                    `options for you based on cinnamon.toml and internal defaults.`
                ].join('\n\n'));
                await this.framework.terminate(true);
            }

            if (errorsMatch(ex, MetadataError.onlyAbstractEntitiesDiscovered())) {
                this.logger.error([
                    `No concrete entities were discovered in the models directory.`,
                    `Please ensure that you have at least one concrete (non-abstract) entity class defined.\n` +
                    ``,
                    `For more information, please refer to the Mikro-ORM manual:\n` +
                    `https://mikro-orm.io/docs/configuration#entity-discovery`,
                    `Note that Cinnamon automatically configures the 'metadataProvider' and 'entities'/'entitiesTs'\n` +
                    `options for you based on cinnamon.toml and internal defaults.`
                ].join('\n\n'));
                await this.framework.terminate(true);
            }

            throw new ThirdPartyError(ex, false);
        }

        // TODO: Inject the Mikro-ORM entity manager forking middleware.
        this.framework.useHook('prepareContext', async () => {
            this.framework.logger['frameworkDebug']('Registering Mikro-ORM middleware on Web Server module...');
            const webServer = this.framework.getModule(WebServer.prototype);

            const databaseReady = this.isInitialized && await this.underlyingOrm.isConnected();
            if (!databaseReady && !this.framework.inDevMode) {
                // If the database is not ready and we're in production, throw
                // a 503 (Service Unavailable) error and log an error.
                this.logger.error('Failed to connect to the database server. Please check your database configuration and credentials, and ensure the database is online.');
                webServer.server.use(async () => {
                    throw new HttpError(
                        'Failed to connect to the database server. Please try again later.',
                        503
                    );
                });
            } else {
                // Otherwise, if we're in development mode, or if the database
                // is ready, we can register the middleware to inject the
                // entity manager into the context, and then a convenience
                // method to access it.
                webServer.server.use(async (_ctx, next) => {
                    return await RequestContext.createAsync(this.underlyingOrm!.em, next);
                });

                webServer.server.use(async (ctx, next) => {
                    Object.defineProperty(ctx, 'getEntityManager', {
                        get(): any {
                            return () => RequestContext.getEntityManager();
                        },
                        enumerable: false,
                        configurable: false,
                    });

                    return await next();
                });
            }
        });

    }

    /**
     * Connects to the database server.
     *
     * If the database is not initialized or the configuration could not be
     * resolved, this method does nothing.
     *
     * If `checked` is true, this method will verify the connection to the
     * database server. If the connection fails, the application will terminate.
     *
     * If `checked` is not specified, it will default to true in production and
     * false in development.
     */
    public async connect() {
        if (!this._underlyingOrmConfig) return;
        await this.underlyingOrm.connect();

        // If checked is true, or not specified and the framework is in
        // production mode, check the connection to the database server.
        if (this.databaseConfig.checked ?? !this.framework.inDevMode) {
            if (!(await this.underlyingOrm.isConnected())) {
                // If checked was not specified, but we ran the check anyway
                // (because we're in production), let the user know.
                // We'll only do this when there's an error, because otherwise
                // it's just noise - and so we'll use the error log level.
                if ((this.databaseConfig.checked === undefined || this.databaseConfig.checked === null) && !this.framework.inDevMode) {
                    this.logger.error([
                        'The connection to the database was checked automatically, because you are in production mode.',
                        '- If you want to force this check, set \'framework.database.checked\' to true in cinnamon.toml.',
                        '- If you do not ever want to check the connection to the database, set \'framework.database.checked\'\n' +
                        '  to false in cinnamon.toml.\n\n',
                    ].join('\n\n'));
                }

                this.logger.error([
                    `Failed to connect to the database server but 'framework.database.checked' was set to true in cinnamon.toml.`,
                    `- If you expected to be able to connect to the database server, please check your\n`+
                    `  Database configuration and credentials, and ensure the database is online.`,
                    `- If you do not want to use the database module at this time, set 'framework.database.enabled'\n` +
                    `  or 'framework.database.checked' to false in cinnamon.toml.`,
                    `Disabling 'checked' will prevent Cinnamon from attempting to verify the connection to the database\n` +
                    `server automatically. The database module will still automatically attempt to connect, but it will not be\n` +
                    `explicitly checked and so may fail on usage.`,
                    `For more information, please refer to the Cinnamon documentation:\n` +
                    `https://docs.apollosoftware.xyz/cinnamon/modules/database\n\n`,
                ].join('\n\n'));

                await this.framework.terminate(true);
                return;
            }
        }
    }

    public async terminate(force: boolean = false) {
        await this.underlyingOrm?.close(force);
        this.underlyingOrm = undefined;
    }

}
