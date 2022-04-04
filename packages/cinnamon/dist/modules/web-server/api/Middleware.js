"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const loader_1 = require("../loader");
const logger_1 = require("../../logger");
/**
 * Registers a middleware function for an API route.
 * @param fn The middleware function that should be executed for the route.
 */
function Middleware(fn) {
    return function (target, propertyKey) {
        if (!loader_1.activeLoader)
            throw new Error("Failed to identify the active loader.");
        // Gather class data.
        const classIdentifier = target.constructor._loaderId;
        const methodIdentifier = propertyKey;
        if (!classIdentifier || !methodIdentifier) {
            loader_1.activeLoader.framework.getModule(logger_1.default.prototype).warn(`Attempted to register middleware on invalid route.`);
            return;
        }
        const classNamespace = (0, uuid_1.v5)(classIdentifier, loader_1.LOADER_ROOT_ROUTE_NAMESPACE);
        const identifier = (0, uuid_1.v5)(methodIdentifier, classNamespace);
        loader_1.default.loadMiddleware(identifier, fn);
    };
}
exports.default = Middleware;
