"use strict";
/**
 * @internal
 * @private
 * @module @apollosoftwarexyz/cinnamon-internals
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = void 0;
var error;
(function (error) {
    class HttpError extends Error {
        /**
         * The status code associated with the error.
         */
        status;
        constructor(message, status) {
            super(message);
            this.status = status ?? 500;
            if (this.status < 400 || this.status >= 600) {
                throw new Error('Errors should have 4xx or 5xx status codes.');
            }
        }
    }
    error.HttpError = HttpError;
})(error = exports.error || (exports.error = {}));
