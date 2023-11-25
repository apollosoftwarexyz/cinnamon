export function isCinnamonError(error: any): error is CinnamonError {
    return error instanceof CinnamonError;
}

export function errorsMatch(error: Error, other: Error) {
    return error.name === other.name && error.message === other.message;
}

/**
 * The base class for all errors thrown by Cinnamon.
 */
export class CinnamonError extends Error {

    /**
     * Whether the stack trace should be shown when the error is handled by
     * Cinnamon's error handling.
     *
     * This is off by default, for exceptions thrown within Cinnamon as
     * the stack trace within Cinnamon is not useful to an end user.
     * @private
     */
    public readonly showStack: boolean;

    constructor(message: string, showStack: boolean = false) {
        super(message);
        this.name = this.constructor.name;
        this.showStack = showStack;
    }

}

/**
 * Indicates that an error occurred in a third-party library.
 */
export class ThirdPartyError extends CinnamonError {

    constructor(error: Error, showStack: boolean = false, message?: string) {
        super(message ? `${error.message}\n\n${message}` : error.message, showStack);
    }

}

/**
 * Indicates that an argument passed to a function is invalid, or that the
 * internal state of a component is invalid (the latter may be in response to
 * an invalid argument).
 *
 * These are grouped (which is perhaps unorthodox) because they are generally
 * handled in the same way and because they imply that some code is being
 * instructed to work in an invalid way (i.e., undefined behavior is being
 * invoked).
 */
export class ArgumentOrStateError extends CinnamonError {

    constructor(message: string, showStack: boolean = true) {
        super(message, showStack);
    }

}

/**
 * Indicates that an assertion in the framework is invalid.
 * This should be used sparingly, and generally serves to 'force'
 * TypeScript into resolving types that are assuredly correct.
 */
export class AssertionError extends CinnamonError {

    constructor(message: string, showStack: boolean = false) {
        super(message, showStack);
    }

}

/**
 * Represents an error that may be returned as an HTTP response.
 * This should be thrown internally within Cinnamon, wherever possible, to
 * ensure that minimal work needs to be done to represent an error as an
 * HTTP error.
 */
export class HttpError extends CinnamonError {

    /**
     * The status code associated with the error.
     */
    public readonly status: number;

    /**
     * The original error, if there was one, that caused the Cinnamon
     * HttpError to be thrown.
     */
    public readonly originalError?: any;

    constructor(message?: string, status?: number, originalError?: any) {
        super(message, false);

        this.status = status ?? 500;
        if (this.status < 400 || this.status >= 600) {
            throw new Error('Errors should have 4xx or 5xx status codes.');
        }

        this.originalError = originalError;
    }

}
