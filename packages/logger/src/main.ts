import * as chalk from 'chalk';
import Cinnamon, { CinnamonModule } from "@apollosoftwarexyz/cinnamon-core";

enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR
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

export default class Logger extends CinnamonModule {

    private readonly showDebugMessages: boolean;

    private readonly logDelegate?: DelegateLogFunction;

    /**
     * Initializes a Cinnamon Framework logger.
     *
     * @param framework The Cinnamon Framework instance
     * @param showDebugMessages If true, messages with the debug log level will be shown.
     * @param logDelegate An optional promise predicate that is passed each log message, so that
     *                    it may be logged with a remote dashboard, for example.
     */
    constructor(framework: Cinnamon, showDebugMessages: boolean = false, logDelegate?: DelegateLogFunction) {
        super(framework);
        this.showDebugMessages = showDebugMessages;
        this.logDelegate = logDelegate;
    }

    debug(message: string) {
        this.log({
            level: LogLevel.DEBUG,
            timestamp: new Date(),
            message
        });
    }

    info(message: string) {
        this.log({
            level: LogLevel.INFO,
            timestamp: new Date(),
            message
        });
    }

    warn(message: string) {
        this.log({
            level: LogLevel.WARN,
            timestamp: new Date(),
            message
        });
    }

    error(message: string) {
        this.log({
            level: LogLevel.ERROR,
            timestamp: new Date(),
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
            case LogLevel.DEBUG:
                printFunction = (...data: any[]) => posixPrintFunction(chalk.gray(...data));
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

        // Log in the console locally.
        printFunction(`${LogLevel[entry.level]}\t[${this.framework.appName}] [${Logger.timestampStringFor(entry.timestamp)}] ${entry.message}`);

        // Now pass to the delegate, if it exists.
        if (this.logDelegate != null) this.logDelegate({
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
