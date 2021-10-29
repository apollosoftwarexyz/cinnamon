import { MikroORM, EntityManager } from "@mikro-orm/core";
import { Configuration } from "@mikro-orm/core/utils/Configuration";
import * as Koa from 'koa';
import { Context, Next } from "koa";
import * as Chalk from 'chalk';
/**
 * @category Core
 * @Core
 */
declare class CinnamonModule {
    protected readonly framework: Cinnamon;
    /**
     * Initializes a default CinnamonModule.
     * @param framework
     */
    constructor(framework: Cinnamon);
}
/// Validation Schema Common definitions
/// ---
/// This file defines attributes which are common to all field types, as
/// well as the operators common to all field types.
/**
 * Defines a type which can either be a common aggregate operator OR a
 * constant value itself.
 */
type ValueOrAggregateOperator<T> = {
    $any?: T[];
    $all?: never;
} | {
    $any?: never;
    $all?: T[];
} | T;
/**
 * Message attributes that are common to all field types.
 */
type ValidationSchemaFieldCommonMessage = {
    /**
     * The human-readable name of the field to be substituted into the invalidMessage.
     * If you set an invalidMessage that does not use the fieldName placeholder (${fieldName}),
     * this will be ignored.
     */
    fieldName?: string;
    /**
     * The message that should be displayed if validation fails.
     * This can either be a string which will be used regardless of the failure reason, or - where
     * applicable - this can be an object which allows setting individual 'invalidMessage's based
     * on the reason.
     */
    invalidMessage?: string;
};
/**
 * Attributes that are common to all field types in the validation schema.
 */
type ValidationSchemaFieldCommon<T> = ({
    /**
     * Tests either the specified value, or each of the specified values in the case
     * of an array being provided, passing validation if the value matches any of the
     * specified values using JavaScript's type-equal equality operator (===).
     *
     * (!!!) If you want to check if the value is equal to one array, or one in
     * a set of nested arrays, use arrayEquals instead.
     */
    equals?: T | T[];
    arrayEquals?: never;
} | {
    equals?: never;
    /**
     * Tests either the specified value (which should be an array), or each of
     * the specified values in the case of an array of arrays being provided,
     * passing validation if the value matches any of the specified values.
     *
     * Instead of using JavaScript's type-equal equality operator (===), the
     * array elements are compared with each other, meaning the array's needn't
     * be sorted (as JSON has no set representation). If your intention is that
     * the array should be equal *in order*, string equality should be checked
     * instead.
     *
     * This is essentially a version of equals that enables checking equality
     * with an array or one in a set of nested arrays. In other words, you'd use
     * this check if the value you're checking would be an array.
     */
    arrayEquals?: T | T[];
}) & {
    /**
     * Tests the value against the regular expression(s). Validation is passed if the
     * regular expression has one or more match, if all the regular expressions have a match ($all)
     * or if any of the regular expressions have a match ($any).
     */
    matches?: ValueOrAggregateOperator<RegExp>;
    /**
     * Whether or not the value must explicitly be present to pass validation.
     * Possible values:
     * - false: (default) value does not need to be present to pass validation.
     * - true: value must be explicitly specified to pass validation and may not be null.
     * - explicit: value must be present (i.e., not undefined) but may be null or nullish to pass validation.
     */
    required?: false | true | "explicit";
} & ValidationSchemaFieldCommonOperators & ValidationSchemaFieldCommonMessage;
/**
 * Operators that can be applied to all field types in the schema.
 */
type ValidationSchemaFieldCommonOperators = {
    /**
     * If set, the value must be equal to the value of the specified property to pass validation.
     */
    $eq?: string;
};
/// Validation Schema Attribute definitions
/// ---
/// This file defines additional attribute types which may be applied to
/// validation attributes contained within a Validation Schema Field.
type ValidationSchemaFieldSmartAttributeOperatorEval<T> = (currentObject: any) => T;
/**
 * A smart attribute can be equal to a direct constant value, or it can be derived from an operator,
 * such as $eq (equal to reference) or $eval (result of function), etc.
 */
type ValidationSchemaFieldSmartAttribute<T> = {
    /**
     * Sets the value of this schema field attribute equal to the reference.
     */
    $eq?: string;
} | {
    /**
     * Evaluates the function, sets the value of this schema field attribute equal to the result of the function.
     */
    $eval?: ValidationSchemaFieldSmartAttributeOperatorEval<T>;
} | T;
/**
 * Defines the validation schema field type 'any', which matches
 * any type.
 */
type ValidationSchemaFieldTypeAny = {
    type: "any";
} & ValidationSchemaFieldCommon<any>;
/**
 * Defines the validation schema field types for primitive types
 * (i.e., types built into TypeScript.)
 */
type ValidationSchemaFieldTypePrimitive = (ValidationSchemaFieldCommon<string> & {
    type: "string";
    /**
     * The minimum length of the string. Must be greater than or equal to zero.
     */
    minLength?: ValidationSchemaFieldSmartAttribute<number>;
    /**
     * The maximum length of the string. There's not explicit maximum but JavaScript
     * struggles with large numbers. Must be greater than or equal to zero.
     */
    maxLength?: ValidationSchemaFieldSmartAttribute<number>;
}) | (ValidationSchemaFieldCommon<boolean> & {
    type: "boolean";
}) | (ValidationSchemaFieldCommon<number> & {
    type: "number";
    /**
     * The minimum value of the number value. The number value must be greater than
     * or equal to this value.
     */
    min?: ValidationSchemaFieldSmartAttribute<number>;
    /**
     * The maximum value of the number value. The number value must be less than or
     * equal to this value.
     */
    max?: ValidationSchemaFieldSmartAttribute<number>;
    /**
     * Whether the number must be a whole integer to pass validation.
     */
    integer?: boolean;
});
/**
 * Defines the validation schema field types for custom fields.
 */
type ValidationSchemaFieldTypeCustom = {
    type: "OneOf";
    possibleSchemas: ValidationSchemaField[];
} & ValidationSchemaFieldCommonMessage;
/**
 * Defines all the possible validation schema field types.
 */
type ValidationSchemaField = ValidationSchemaFieldTypeAny | ValidationSchemaFieldTypePrimitive | ValidationSchemaFieldTypeCustom;
/**
 * Recursively defines a 'ValidationSchemaObject', which is a dictionary of string key to
 * ValidationSchemaField (or nested sub-schema) entries.
 */
interface ValidationSchemaObject {
    [key: string]: ValidationSchemaField | ValidationSchemaObject;
}
/**
 * Defines a top-level ValidationSchema object, which is either an individual field or a
 * top-level ValidationSchemaObject.
 */
type ValidationSchema = ValidationSchemaField | ValidationSchemaObject;
declare class ValidationResult {
    readonly success: boolean;
    readonly message?: string;
    constructor(options: {
        success: boolean;
        message?: string;
    });
    static success(): ValidationResult;
    static fail(message?: string): ValidationResult;
}
/**
 * A Validator handles performing validation on objects according to the specified schema provided to it when it was
 * initialized.
 */
declare class Validator {
    readonly schema: ValidationSchema;
    /**
     * Whether or not the schema on this executor is for a single field (i.e.. a
     * validation schema field) (= true) or for an entire object (i.e., a
     * validation schema object) (= false).
     */
    private readonly isSingleFieldSchema;
    /**
     * Initializes a ValidationSchemaExecutor with the specified schema. Once initialized, the
     * schema may not be changed (you should use a new ValidationSchemaExecutor for a new schema).
     *
     * @param schema The schema the ValidationSchemaExecutor should perform validation with.
     */
    constructor(schema: ValidationSchema);
    /**
     * Performs validation on the specified value according to the executor's specified schema.
     * If validation passes, this method returns true, otherwise it returns false.
     *
     * @param value The value to check (perform validation) against the schema.
     */
    validate(value: any): ValidationResult;
    private validateSchemaAgainstObject;
    private validateSchemaAgainstField;
    private _evaluateAttributeValues;
    private _fail;
    private _badFieldMessage;
    private _toHumanReadableFieldName;
    /**
     * Checks if the specified object is a validation schema object (true) or
     * a single validation schema field (false).
     * @param  value               The object to check.
     * @return {boolean} isValidationSchemaObject - true the specified value is
     * a validation schema object, false if it's just a validation shema field.
     */
    private _isValidationSchemaObject;
}
/**
 * An alias to create a validator from the specified schema.
 * (Put simply, a validator handles performing validation on objects according to the specified validation schema.)
 *
 * This method is also exported as '$' to allow for convenient access to the validator.
 *
 * @param schema The schema to perform validation of values against.
 */
declare function createValidator(schema: ValidationSchema): Validator;
/**
 * @category Core Modules
 * @CoreModule
 */
declare class Config extends CinnamonModule {
    private appConfig?;
    /**
     * Whether or not validation failed when the config was loaded.
     *
     * If no validator is set, this will naturally always return false (as no
     * validation occurred).
     *
     * If the framework is set to halt when the app configuration validation
     * fails this value will, of course, be useless as the app won't be running
     * to read it in the case where it's true.
     */
    readonly didFailValidation: boolean;
    /**
     * Returns true if the app configuration section is present (it may still
     * be empty, this just guarantees that it's not null or undefined.) False
     * if it isn't - in other words if it *is* null or undefined.
     *
     * This will also return false if validation failed (as the module will
     * refuse to load an invalid config, instead setting the app configuration
     * to null.)
     *
     * @return Whether the app config is present and loaded in the config
     * module.
     */
    get hasAppConfig(): boolean;
    /**
     * @CoreModule
     * Initializes a Cinnamon Framework configuration module.
     * This module is responsible for holding application configuration for the
     * current framework instance.
     *
     * @param framework The Cinnamon framework instance.
     * @param appConfig The app table of the cinnamon.toml configuration file.
     * @param appConfigValidator A schema validator for the app configuration,
     * this would usually be passed into the framework as a Cinnamon
     * initialization option.
     */
    constructor(framework: Cinnamon, appConfig?: any, appConfigSchema?: ValidationSchema);
    /**
     * Retrieves a value from the Cinnamon app configuration table. This can
     * retrieve nested values using a period (.) to delimit a nested object in
     * the key.
     *
     * @param key The key of the value to look up in the app configuration.
     * @return {T} value - The retrieved value from the configuration file.
     */
    get<T = any>(key: string): T;
    /**
     * Sets a value in the Cinnamon app configuration table. As with get, this
     * can set nested values with the key using a period (.) to delimit a nested
     * object.
     *
     * Before writing the key, the value will be checked to ensure it can be
     * properly serialized and de-serialized. If it cannot, (e.g., because it is
     * a runtime object), the operation will immediately fail and the app
     * configuration object will not be touched.
     *
     * If the configuration wasn't initialized, this will initialize an empty
     * configuration before attempting to set the key.
     *
     * If the key denotes nested objects that aren't initialized, they will
     * first be initialized before the value is set.
     *
     * @param key The key of the value to update in the app configuration.
     * @param value The value to update the property at `key` to.
     */
    set<T>(key: string, value: T): void;
}
declare module ConfigWrapper {
    export { Config };
}
import _ConfigModule = ConfigWrapper.Config;
declare enum LogLevel {
    /**
     * **Used for internal framework-level debugging messages.**
     * This log-level should not be used by any application and definitely not in production.
     */
    FRAMEWORK = -1,
    /**
     * **Used for app-level debugging messages.**
     * These will not be printed if {@link showDebugMessages} is `false`. _They will still be passed to the logging
     * delegate if it is present regardless of {@link showDebugMessages}._
     */
    DEBUG = 0,
    /**
     * **General application information.**
     * A typical example of how this would be used is printing status messages. You should not use this logging level
     * for printing:
     * - **warnings or errors:** use the appropriate level, so they are more apparent in terms of drawing attention and
     *   so the delegate can handle the warnings and errors appropriately (e.g. for dispatching notifications).
     * - **debugging information:** use the DEBUG level, so the delegate has more control over logging messages. (e.g.
     *   you may have information useful when debugging locally but your delegate might log messages with an external
     *   server or application and including debugging messages as INFO level would pollute your logs leaving you with
     *   no way to filter them out.)
     *
     * This logging level is also used by the framework during startup to indicate module initialization status and to
     * help indicate whether the system is functioning normally.
     */
    INFO = 1,
    /**
     * **Application warnings.**
     * These are messages that may be important and thus should be highlighted, but are not crucial or detrimental to
     * the operation of the application. For example, deprecation messages, inability to locate or activate a soft
     * dependency, etc.
     *
     * A good example of when this is used is by the framework, upon startup, to display a warning if the application is
     * in debug mode as certain performance optimizations and security features may be turned off.
     */
    WARN = 2,
    /**
     * **Application errors.**
     * These messages are critical. Whilst not necessarily indicating a crash will/has occurred, an error indicates that
     * something on the server has not functioned as expected because of a problem with the application which would need
     * to be rectified by the systems administrator in production and/or the application developer because of a
     * programming oversight.
     *
     * This logging level is used by the framework if it failed to initialize or a key operation failed and the
     * application must be halted.
     *
     * It may be beneficial to use a {@link ExtendedLoggerOptions.logDelegate} to dispatch a notification when an error
     * occurs so they can be observed from an external dashboard or immediate action may be taken to rectify or better
     * understand the error.
     */
    ERROR = 3
}
/**
 * Represents a log message.
 * This is the object passed to the {@see DelegateLogFunction} or the log method.
 */
interface LogEntry {
    /**
     * The LogLevel of the log. One of DEBUG, INFO, WARN or ERROR.
     */
    level: LogLevel;
    /**
     * The timestamp of the log entry, in JavaScript Date form.
     */
    timestamp: Date;
    /**
     * The module that generated the log entry. Leave as none for default (application).
     */
    module?: string;
    /**
     * The textual message that was logged.
     */
    message: string;
}
interface DelegateLogEntry extends LogEntry {
    /**
     * A string representation of the log level.
     */
    levelString: string;
    /**
     * The prefix of the logger that generated the log entry.
     */
    prefix: string;
    /**
     * A string representation of the timestamp of the log entry.
     */
    timestampString: string;
}
type DelegateLogFunction = (message: DelegateLogEntry) => void;
interface ExtendedLoggerOptions {
    /**
     * Whether internal framework debugging messages should be displayed/logged as well as application debugging
     * messages.
     */
    showFrameworkDebugMessages: boolean;
    /**
     * An optional promise predicate that is passed each log message to facilitate an extended logging pipeline, so that
     * it may be logged with a remote dashboard for example. Put simply, if this function is present, all log messages
     * pass through this function.
     */
    logDelegate?: DelegateLogFunction;
}
/**
 * @category Core Modules
 * @CoreModule
 */
declare class Logger extends CinnamonModule {
    /**
     * Whether application debug messages should be displayed.
     * @private
     */
    private readonly showDebugMessages;
    /**
     * @see ExtendedLoggerOptions
     * @private
     */
    private readonly showFrameworkDebugMessages;
    /**
     * @see ExtendedLoggerOptions
     * @private
     */
    private readonly logDelegate?;
    /**
     * @CoreModule
     * Initializes a Cinnamon Framework logger.
     *
     * @param framework The Cinnamon Framework instance
     * @param showDebugMessages If true, messages with the debug log level will be shown.
     * @param options Extended options for the logger module.
     */
    constructor(framework: Cinnamon, showDebugMessages?: boolean, options?: ExtendedLoggerOptions);
    /**
     * Logs an internal framework messages. Intended for internal framework-use only.
     * @param message The framework message to log.
     * @param module The module that generated the log.
     * @private
     */
    frameworkDebug(message: string, module?: string): void;
    debug(message: string, module?: string): void;
    info(message: string, module?: string): void;
    warn(message: string, module?: string): void;
    error(message: string, module?: string): void;
    /**
     * Logs the specified LogEntry. This is generally intended for internal use only.
     * @param entry The log entry to be displayed and passed to the remote log delegate.
     */
    log(entry: LogEntry): void;
    static timestampStringFor(date: Date): string;
}
declare module LoggerWrapper {
    export { Logger };
}
import _LoggerModule = LoggerWrapper.Logger;
type CinnamonDatabaseConfiguration = {
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
declare class Database extends CinnamonModule {
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
    get logger(): Logger;
    /**
     * Check if the underlying ORM engine (MikroORM) has been initialized yet.
     * Will return true if it has, or false if it hasn't.
     */
    get isInitialized(): boolean;
    get entityManager(): EntityManager;
    get em(): EntityManager;
    initialize(databaseConfig: CinnamonDatabaseConfiguration): Promise<void>;
}
declare module DatabaseWrapper {
    export { Database };
}
import _DatabaseModule = DatabaseWrapper.Database;
declare let Config$0: _ConfigModule;
declare let Logger$0: _LoggerModule;
declare let Database$0: EntityManager;
declare let DatabaseModule: _DatabaseModule;
declare function initializeCoreModules(modules: {
    Config: _ConfigModule;
    Logger: _LoggerModule;
    Database: _DatabaseModule;
}): void;
type CinnamonInitializationOptions = {
    /**
     * An optional validation schema for the app configuration.
     */
    appConfigSchema?: ValidationSchema;
};
/**
 * The main class of the Cinnamon framework. To initialize the framework, you initialize
 * this class by calling {@link Cinnamon.initialize}.
 *
 * This will, in turn, initialize all of Cinnamon's default module set.
 *
 * @category Core
 * @Core
 */
declare class Cinnamon {
    /**
     * Gets the default instance of Cinnamon. This is ordinarily the only instance of Cinnamon
     * that would be running, however it may be desired that the framework run twice in the
     * same application, in which case this will be the first instance that was started.
     *
     * If no instance of Cinnamon has been initialized, this will be undefined.
     */
    static get defaultInstance(): Cinnamon | undefined;
    private static _defaultInstance?;
    private readonly devMode;
    readonly appName: string;
    private readonly modules;
    constructor(props: {
        devMode?: boolean;
        appName?: string;
    });
    /**
     * Whether the framework is in application development mode.
     * When set to true, features such as hot-reload will be automatically enabled.
     *
     * You should set this to false for production applications as there may be a performance
     * or security penalty present when certain development features are active.
     */
    get inDevMode(): boolean;
    /**
     * Checks if the specified module is registered in the framework based on its type.
     * If it is, the module is returned, otherwise false is returned.
     *
     * @param moduleType The module type (i.e. typeof MyModule)
     */
    hasModule<T extends CinnamonModule>(moduleType: T): T | boolean;
    /**
     * Gets the module if it is registered in the framework based on its type.
     * If it is not registered, an exception is thrown.
     *
     * @param moduleType The module type (i.e. typeof MyModule)
     */
    getModule<T extends CinnamonModule>(moduleType: T): T;
    /**
     * Registers the specified module.
     * If it has already been registered in the framework, the old module reference
     * will be overwritten with the new one.
     *
     * @param module The module instance to register.
     */
    registerModule<T extends CinnamonModule>(module: T): void;
    /**
     * Starts the initialization process for the framework. If an error happens during
     * initialization it is considered fatal and, therefore, the framework will terminate
     * the process with a POSIX error code.
     *
     * @param options Options that will be passed to various core internal
     * framework modules as they're initialized.
     * @return {Cinnamon} frameworkInstance - The initialized Cinnamon framework
     * instance.
     */
    static initialize(options?: CinnamonInitializationOptions): Promise<Cinnamon>;
    /**
     * Attempts to shut down any applicable modules, and then terminates the application.
     * This should be used if an unrecoverable exception is encountered with inErrorState
     * set to true.
     *
     * If you're just shutting down the web server for normal reasons, e.g. to install
     * updates, per user request, use terminate with inErrorState set to false.
     *
     * @param inErrorState Whether the application had to shut down because of an error
     * (true) or not (false).
     */
    terminate(inErrorState?: boolean): Promise<void>;
}
declare enum Method {
    /**
     * The GET method requests a representation of a given resource.
     * Requests using GET should only retrieve data.
     *
     * Recommended for READ of CRUD.
     */
    GET = "GET",
    /**
     * The HEAD method requests a resource identical to that of a GET
     * request but without the response body.
     *
     * Recommended for implementing things like connectivity checks,
     * see also: TRACE.
     */
    HEAD = "HEAD",
    /**
     * The TRACE method performs a loop-back test along the path to the
     * target resource. This can be used as a debugging mechanism.
     */
    TRACE = "TRACE",
    /**
     * The POST method is used to submit an entity to a given resource.
     * This will often cause a change of state of side-effects on the
     * server.
     *
     * Recommended for CREATE of CRUD.
     */
    POST = "POST",
    /**
     * The PUT method replaces all current representations of the specified
     * resource with the request payload.
     *
     * Recommended for the UPDATE of CRUD.
     */
    PUT = "PUT",
    /**
     * The DELETE method deletes the specified resource.
     *
     * Recommended for the DELETE of CRUD.
     */
    DELETE = "DELETE",
    /**
     * The OPTIONS method is used to describe the communication options
     * for the target resource. This is used by browsers to determine
     * what headers can be sent to 'writable' API methods such as POST
     * methods, for example.
     */
    OPTIONS = "OPTIONS",
    /**
     * The PATCH method is used to apply partial modifications to
     * a resource.
     *
     * Recommended for more finely grained control of the UPDATE
     * of CRUD.
     */
    PATCH = "PATCH"
}
/**
 * Registers a class as a Cinnamon API controller.
 * Each entry in the 'group' array is a 'directory' in the path that each
 * member of this controller will be prefixed with. For example, if the
 * group is ['api', 'v1', 'example'], each route in the controller will
 * be prefixed with /api/v1/example from the base URL of the web server.
 *
 * @param group The API 'group' this controller belongs to.
 */
declare function Controller(...group: string[]): (target: any) => void;
/**
 * Registers a class method as an API route.
 *
 * @param method The HTTP method that the client must use to call this method.
 * @param path The path that the client must use to call this method.
 */
declare function Route(method: Method, path: string): (target: any, propertyKey: string, descriptor?: PropertyDescriptor | undefined) => void;
type MiddlewareFn = Function;
/**
 * Registers a middleware function for an API route.
 * @param fn The middleware function that should be executed for the route.
 */
declare function Middleware(fn: MiddlewareFn): (target: any, propertyKey: string) => void;
export { Cinnamon as default, CinnamonModule, Config$0 as Config, Logger$0 as Logger, Database$0 as Database, DatabaseModule, initializeCoreModules, Method, Controller, Route, Middleware, ValidationSchema, createValidator, createValidator as $, Validator, ValidationResult, Koa, Context, Next, Chalk };
