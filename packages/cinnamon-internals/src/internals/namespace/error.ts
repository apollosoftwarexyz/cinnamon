/**
 * @internal
 * @private
 * @module @apollosoftwarexyz/cinnamon-internals
 */

export namespace error {

    export class HttpError extends Error {

        /**
         * The status code associated with the error.
         */
        public readonly status: number;

        constructor(message?: string, status?: number) {
            super(message);
            this.status = status ?? 500;
            if (this.status < 400 || this.status >= 600) {
                throw new Error('Errors should have 4xx or 5xx status codes.');
            }
        }

    }

}
