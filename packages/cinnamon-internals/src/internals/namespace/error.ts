/**
 * @internal
 * @private
 * @module @apollosoftwarexyz/cinnamon-internals
 */

export namespace error {

    /**
     * Indicates that an assertion in the framework is invalid.
     * This should be used sparingly, and generally serves to 'force' TypeScript into resolving types that are
     * assuredly correct.
     */
    export class AssertionError extends Error {

        constructor(message: string) {
            super(message);
        }

    }

    /**
     * Represents an error that may be returned as an HTTP response.
     * This should be thrown internally within Cinnamon, wherever possible, to ensure that minimal work needs to be done
     * to represent an error as an HTTP error.
     */
    export class HttpError extends Error {

        /**
         * The status code associated with the error.
         */
        public readonly status: number;

        /**
         * The original error, if there was one, that caused the Cinnamon HttpError
         * to be thrown.
         */
        public readonly originalError?: any;

        constructor(message?: string, status?: number, originalError?: any) {
            super(message);

            this.status = status ?? 500;
            if (this.status < 400 || this.status >= 600) {
                throw new Error('Errors should have 4xx or 5xx status codes.');
            }

            this.originalError = originalError;
        }

    }

}
