"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
const cinnamon_module_1 = require("../sdk/cinnamon-module");
const chalk = require("chalk");
var LogLevel;
(function (LogLevel) {
    /**
     * **Used for internal framework-level debugging messages.**
     * This log-level should not be used by any application and definitely not in production.
     */
    LogLevel[LogLevel["FRAMEWORK"] = -1] = "FRAMEWORK";
    /**
     * **Used for app-level debugging messages.**
     * These will not be printed if {@link showDebugMessages} is `false`. _They will still be passed to the logging
     * delegate if it is present regardless of {@link showDebugMessages}._
     */
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
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
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    /**
     * **Application warnings.**
     * These are messages that may be important and thus should be highlighted, but are not crucial or detrimental to
     * the operation of the application. For example, deprecation messages, inability to locate or activate a soft
     * dependency, etc.
     *
     * A good example of when this is used is by the framework, upon startup, to display a warning if the application is
     * in debug mode as certain performance optimizations and security features may be turned off.
     */
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
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
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
/**
 * @category Core Modules
 * @CoreModule
 */
class LoggerModule extends cinnamon_module_1.CinnamonModule {
    /**
     * Whether application debug messages should be displayed.
     * @private
     */
    showDebugMessages;
    /**
     * @see ExtendedLoggerOptions
     * @private
     */
    showFrameworkDebugMessages;
    /**
     * @see ExtendedLoggerOptions
     * @private
     */
    logDelegate;
    /**
     * @see ExtendedLoggerOptions
     * @private
     */
    silenced;
    /**
     * @CoreModule
     * Initializes a Cinnamon Framework logger.
     *
     * @param framework The Cinnamon Framework instance
     * @param showDebugMessages If true, messages with the debug log level will be shown.
     * @param options Extended options for the logger module.
     */
    constructor(framework, showDebugMessages = false, options) {
        super(framework);
        this.showDebugMessages = showDebugMessages;
        this.silenced = options?.silenced ?? false;
        this.logDelegate = this.silenced ? undefined : options?.logDelegate;
        this.showFrameworkDebugMessages = options?.showFrameworkDebugMessages ?? false;
    }
    /**
     * Logs an internal framework messages. Intended for internal framework-use only.
     * @param message The framework message to log.
     * @param module The module that generated the log.
     * @internal
     */
    frameworkDebug(message, module) {
        this.log({
            level: LogLevel.FRAMEWORK,
            timestamp: new Date(),
            module,
            message
        });
    }
    /**
     * Log a debug message with the logger.
     * This message will also be passed to the {@link DelegateLogFunction}.
     *
     * **Used for app-level debugging messages.**
     * These will not be printed if {@link showDebugMessages} is `false`. _They will still be passed to the logging
     * delegate if it is present regardless of {@link showDebugMessages}._
     *
     * @param message The message to log.
     * @param module Optionally, a module name to prefix to the log message.
     */
    debug(message, module) {
        this.log({
            level: LogLevel.DEBUG,
            timestamp: new Date(),
            module,
            message
        });
    }
    /**
     * Log a general information message with the logger.
     * This message will also be passed to the {@link DelegateLogFunction}.
     *
     * **General application information.**
     * A typical example of how this would be used is printing status messages. You should not use this logging level
     * for printing:
     * - **warnings or errors:** use the appropriate level (either {@link warn} or {@link error}), so they are more
     *   apparent in terms of drawing attention and so the delegate can handle the warnings and errors appropriately
     *   (e.g. for dispatching notifications).
     * - **debugging information:** use {@link debug}, so the delegate has more control over logging messages. (e.g.
     *   you may have information useful when debugging locally but your delegate might log messages with an external
     *   server or application and including debugging messages as INFO level would pollute your logs leaving you with
     *   no way to filter them out.)
     *
     * @param message The message to log.
     * @param module Optionally, a module name to prefix to the log message.
     */
    info(message, module) {
        this.log({
            level: LogLevel.INFO,
            timestamp: new Date(),
            module,
            message
        });
    }
    /**
     * Log a warning message with the logger.
     * This message will also be passed to the {@link DelegateLogFunction}.
     *
     * **Application warnings.**
     * These are messages that may be important and thus should be highlighted, but are not crucial or detrimental to
     * the operation of the application. For example, deprecation messages, inability to locate or activate a soft
     * dependency, etc.
     *
     * A good example of when this is used is by the framework, upon startup, to display a warning if the application is
     * in debug mode as certain performance optimizations and security features may be turned off.
     *
     * @param message The message to log.
     * @param module Optionally, a module name to prefix to the log message.
     */
    warn(message, module) {
        this.log({
            level: LogLevel.WARN,
            timestamp: new Date(),
            module,
            message
        });
    }
    /**
     * Log an error message with the logger.
     * This message will also be passed to the {@link DelegateLogFunction}.
     *
     * **Application errors.**
     * These messages are critical. Whilst not necessarily indicating a crash will/has occurred, an error indicates that
     * something on the server has not functioned as expected because of a problem with the application which would need
     * to be rectified by the systems administrator in production and/or the application developer because of a
     * programming oversight.
     *
     * It may be beneficial to use a {@link ExtendedLoggerOptions.logDelegate} to dispatch a notification when an error
     * occurs so they can be observed from an external dashboard or immediate action may be taken to rectify or better
     * understand the error.
     *
     * @param message The message to log.
     * @param module Optionally, a module name to prefix to the log message.
     */
    error(message, module) {
        this.log({
            level: LogLevel.ERROR,
            timestamp: new Date(),
            module,
            message
        });
    }
    /**
     * Logs the specified LogEntry. This is generally intended for internal use only.
     * @param entry The log entry to be displayed and passed to the remote log delegate.
     */
    log(entry) {
        if (this.silenced && entry.level < LogLevel.ERROR)
            return;
        // The function that will print the content to the underlying OS POSIX stream.
        // (Essentially STDERR vs STDOUT)
        let posixPrintFunction = entry.level === LogLevel.ERROR ? console.error : console.log;
        let printFunction;
        switch (entry.level) {
            case LogLevel.FRAMEWORK:
                if (!this.showFrameworkDebugMessages) {
                    printFunction = null;
                    break;
                }
                printFunction = (...data) => posixPrintFunction(chalk.bgGray.whiteBright(...data));
                break;
            case LogLevel.DEBUG:
                if (!this.showDebugMessages) {
                    printFunction = null;
                    break;
                }
                printFunction = (...data) => posixPrintFunction(chalk.bgGray.whiteBright(...data));
                break;
            case LogLevel.WARN:
                printFunction = (...data) => posixPrintFunction(chalk.bgRed.whiteBright.bold(...data));
                break;
            case LogLevel.ERROR:
                printFunction = (...data) => posixPrintFunction(chalk.red(...data));
                break;
            default:
                printFunction = (...data) => posixPrintFunction(...data);
                break;
        }
        // Generate the module name.
        const moduleName = entry.module ? ` [${entry.module}]` : '';
        // Log in the console locally.
        if (printFunction !== null)
            printFunction(`${LogLevel[entry.level]}\t[${this.framework.appName}]${moduleName} [${LoggerModule.timestampStringFor(entry.timestamp)}] ${entry.message}`);
        // Now pass to the delegate, if it exists, and we aren't logging a framework debugging message without it being
        // explicitly enabled.
        if (this.logDelegate != null && (entry.level != LogLevel.FRAMEWORK || this.showFrameworkDebugMessages))
            this.logDelegate({
                ...entry,
                levelString: LogLevel[entry.level],
                prefix: this.framework.appName,
                timestampString: LoggerModule.timestampStringFor(entry.timestamp)
            });
    }
    static timestampStringFor(date) {
        let padStart = (_) => _.toString().padStart(2, '0');
        let time = `${padStart(date.getHours())}:${padStart(date.getMinutes())}:${padStart(date.getSeconds())}`;
        return `${date.getFullYear()}-${padStart(date.getMonth() + 1)}-${padStart(date.getDate())} ${time}`;
    }
}
exports.default = LoggerModule;
