import * as chalk from 'chalk';
import Cinnamon, { CinnamonModule } from "@apollosoftwarexyz/cinnamon-core";

enum LogLevel {
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
    DEBUG,

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
    INFO,

    /**
     * **Application warnings.**
     * These are messages that may be important and thus should be highlighted, but are not crucial or detrimental to
     * the operation of the application. For example, deprecation messages, inability to locate or activate a soft
     * dependency, etc.
     *
     * A good example of when this is used is by the framework, upon startup, to display a warning if the application is
     * in debug mode as certain performance optimizations and security features may be turned off.
     */
    WARN,

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
    ERROR,
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
    logDelegate?: DelegateLogFunction
}

export default class Logger extends CinnamonModule {

    /**
     * Whether application debug messages should be displayed.
     * @private
     */
    private readonly showDebugMessages: boolean;

    /**
     * @see ExtendedLoggerOptions
     * @private
     */
    private readonly showFrameworkDebugMessages: boolean;

    /**
     * @see ExtendedLoggerOptions
     * @private
     */
    private readonly logDelegate?: DelegateLogFunction;

    /**
     * @CoreModule
     * Initializes a Cinnamon Framework logger.
     *
     * @param framework The Cinnamon Framework instance
     * @param showDebugMessages If true, messages with the debug log level will be shown.
     * @param options Extended options for the logger module.
     */
    constructor(framework: Cinnamon, showDebugMessages: boolean = false, options?: ExtendedLoggerOptions) {
        super(framework);
        this.showDebugMessages = showDebugMessages;

        this.logDelegate = options?.logDelegate;
        this.showFrameworkDebugMessages = options?.showFrameworkDebugMessages ?? false;
    }

    /**
     * Logs an internal framework messages. Intended for internal framework-use only.
     * @param message The framework message to log.
     * @param module The module that generated the log.
     * @private
     */
    frameworkDebug(message: string, module?: string) {
        this.log({
            level: LogLevel.FRAMEWORK,
            timestamp: new Date(),
            module,
            message
        })
    }

    debug(message: string, module?: string) {
        this.log({
            level: LogLevel.DEBUG,
            timestamp: new Date(),
            module,
            message
        });
    }

    info(message: string, module?: string) {
        this.log({
            level: LogLevel.INFO,
            timestamp: new Date(),
            module,
            message
        });
    }

    warn(message: string, module?: string) {
        this.log({
            level: LogLevel.WARN,
            timestamp: new Date(),
            module,
            message
        });
    }

    error(message: string, module?: string) {
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
    log(entry: LogEntry) {
        // The function that will print the content to the underlying OS POSIX stream.
        // (Essentially STDERR vs STDOUT)
        let posixPrintFunction = entry.level !== LogLevel.ERROR ? console.error : console.log;

        let printFunction;
        switch (entry.level) {
            case LogLevel.FRAMEWORK:
                if (!this.showFrameworkDebugMessages) {
                    printFunction = null;
                    break;
                }
                printFunction = (...data: any[]) => posixPrintFunction(chalk.bgGray.whiteBright(...data));
                break;
            case LogLevel.DEBUG:
                if (!this.showDebugMessages) {
                    printFunction = null;
                    break;
                }
                printFunction = (...data: any[]) => posixPrintFunction(chalk.bgGray.whiteBright(...data));
                break;
            case LogLevel.WARN:
                printFunction = (...data: any[]) => posixPrintFunction(chalk.red(...data));
                break;
            case LogLevel.ERROR:
                printFunction = (...data: any[]) => posixPrintFunction(chalk.bgRed.whiteBright.bold(...data));
                break;
            default:
                printFunction = (...data: any[]) => posixPrintFunction(...data);
                break;
        }

        // Generate the module name.
        const moduleName = entry.module ? ` [${entry.module}]` : '';

        // Log in the console locally.
        if (printFunction !== null)
            printFunction(`${LogLevel[entry.level]}\t[${this.framework.appName}]${moduleName} [${Logger.timestampStringFor(entry.timestamp)}] ${entry.message}`);

        // Now pass to the delegate, if it exists, and we aren't logging a framework debugging message without it being
        // explicitly enabled.
        if (this.logDelegate != null && (entry.level != LogLevel.FRAMEWORK || this.showFrameworkDebugMessages))
            this.logDelegate({
                ...entry,
                levelString: LogLevel[entry.level],
                prefix: this.framework.appName,
                timestampString: Logger.timestampStringFor(entry.timestamp)
            });
    }

    static timestampStringFor(date: Date) {
        let padStart = (_: number) => _.toString().padStart(2, '0');
        let time = `${padStart(date.getHours())}:${padStart(date.getMinutes())}:${padStart(date.getSeconds())}`;

        return `${date.getFullYear()}-${padStart(date.getMonth() + 1)}-${padStart(date.getDate())} ${time}`;
    }

}
