/**
 * @internal
 * @private
 * @module @apollosoftwarexyz/cinnamon-internals
 */
export declare namespace error {
    class HttpError extends Error {
        /**
         * The status code associated with the error.
         */
        readonly status: number;
        constructor(message?: string, status?: number);
    }
}
