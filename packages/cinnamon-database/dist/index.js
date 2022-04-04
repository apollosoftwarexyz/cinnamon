"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@mikro-orm/core");
const reflection_1 = require("@mikro-orm/reflection");
const cinnamon_1 = require("@apollosoftwarexyz/cinnamon");
const cinnamon_internals_1 = require("@apollosoftwarexyz/cinnamon-internals");
/**
 * @category Core Modules
 * @CoreModule
 */
class DatabaseModule extends cinnamon_1.CinnamonModule {
    _underlyingOrmConfig;
    /**
     * Returns the ORM configuration as it would be passed to Mikro-ORM in the
     * database module.
     */
    get ormConfig() {
        return this._underlyingOrmConfig;
    }
    underlyingOrm;
    modelsPath;
    /**
     * @CoreModule
     * Initializes Cinnamon's Database & ORM module.
     *
     * @param framework The Cinnamon Framework instance.
     * @param modelsPath The path to the models directory.
     * @private
     */
    constructor(framework, modelsPath) {
        super(framework);
        this.modelsPath = modelsPath;
    }
    get logger() { return this.framework.getModule(cinnamon_1.LoggerModule.prototype); }
    /**
     * Check if the underlying ORM engine (MikroORM) has been initialized yet.
     * Will return true if it has, or false if it hasn't.
     */
    get isInitialized() {
        return this.underlyingOrm !== undefined;
    }
    get entityManager() {
        if (!this.isInitialized) {
            // @ts-ignore
            return undefined;
        }
        return this.underlyingOrm.em;
    }
    get em() {
        return this.entityManager;
    }
    get requestContext() {
        return core_1.RequestContext;
    }
    async initialize(databaseConfig) {
        if (this.isInitialized) {
            throw new Error("The database module is already initialized. You cannot initialize it again.");
        }
        this.logger.frameworkDebug("Database module is loading models now.");
        // Ensure the models directory is present.
        // We do this check in core startup, but this will ensure we're in the correct state
        // even if this module is loaded independently of the default distribution's core class.
        if (!await cinnamon_internals_1.default.fs.directoryExists(this.modelsPath)) {
            this.logger.error(`Unable to load database models due to missing controllers directory: ${cinnamon_internals_1.default.fs.toAbsolutePath(this.modelsPath)}`);
            if (databaseConfig.terminateOnInitError)
                await this.framework.terminate(true);
            else
                this.logger.error(`Database initialization halted. The database module has NOT been initialized.`);
            return;
        }
        // Validate the database configuration.
        if (!databaseConfig.type ||
            !databaseConfig.database ||
            (databaseConfig.type !== 'mongo' && (!databaseConfig.host ||
                !databaseConfig.port ||
                isNaN(databaseConfig.port))) ||
            (databaseConfig.type === 'mongo' && !databaseConfig.clientUrl)) {
            this.logger.error(`Invalid database configuration. For a ${databaseConfig.type ? databaseConfig.type + ' ' : ''}database, you must set at least:`);
            if (databaseConfig.type === "mongo")
                this.logger.error(`type, clientUrl`);
            else if (!!databaseConfig.type)
                this.logger.error(`type, host, port, database`);
            else {
                this.logger.error(`type = 'mongo', database and clientUrl, or`);
                this.logger.error(`type, host, port, database`);
            }
            this.logger.error(`For more information, please refer to the Mikro-ORM manual:`);
            this.logger.error(`https://mikro-orm.io/docs/`);
            if (databaseConfig.terminateOnInitError)
                await this.framework.terminate(true);
            else
                this.logger.error(`Database initialization halted. The database module has NOT been initialized.`);
            return;
        }
        // Validate the specified database type.
        let validateDatabaseTypes = Object.keys(core_1.Configuration.PLATFORMS);
        if (!validateDatabaseTypes.includes(databaseConfig.type)) {
            this.logger.error(`Invalid database type specified: ${databaseConfig.type ?? '<none>'}. Is there a typo?`);
            this.logger.error(`Please check your project's cinnamon.toml file.`);
            this.logger.error(`Valid database types are: ${validateDatabaseTypes}`);
            if (databaseConfig.terminateOnInitError)
                await this.framework.terminate(true);
            else
                this.logger.error(`Database initialization halted. The database module has NOT been initialized.`);
            return;
        }
        try {
            let hasCredentials = databaseConfig.type !== 'mongo' && (databaseConfig.username != null && databaseConfig.password != null);
            this._underlyingOrmConfig = {
                metadataProvider: reflection_1.TsMorphMetadataProvider,
                type: databaseConfig.type,
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
        }
        catch (ex) {
            this.logger.error(`Failed to initialize MikroORM (ORM engine).`);
            console.error(ex);
            if (databaseConfig.terminateOnInitError)
                await this.framework.terminate(true);
            else
                this.logger.error(`Database initialization halted. The database module has NOT been initialized.`);
        }
    }
    /**
     * Open the connection to the database server.
     * If the database is not initialized or the configuration could not be resolved,
     * this method does nothing.
     */
    async connect() {
        if (!this._underlyingOrmConfig)
            return;
        let databaseOptions = {};
        if (this._underlyingOrmConfig.type === "mongo") {
            databaseOptions = { ensureIndexes: true };
        }
        this.underlyingOrm = await core_1.MikroORM.init({
            ...this._underlyingOrmConfig,
            ...databaseOptions
        });
    }
    async terminate(force = false) {
        await this.underlyingOrm?.close(force);
        this.underlyingOrm = undefined;
    }
}
exports.default = DatabaseModule;