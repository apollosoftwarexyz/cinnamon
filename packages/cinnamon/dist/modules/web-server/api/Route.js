"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loader_1 = require("../loader");
const uuid_1 = require("uuid");
/**
 * Registers a class method as an API route.
 *
 * @param method The HTTP method that the client must use to call this method.
 * @param path The path that the client must use to call this method.
 */
function Route(method, path) {
    return function (target, propertyKey, descriptor) {
        // Ensure target class has a unique ID.
        if (!target.constructor._loaderId) {
            target.constructor._loaderId = (0, uuid_1.v4)();
        }
        // Gather class data.
        const functionName = propertyKey;
        const handler = descriptor?.value;
        if (handler == null)
            return;
        // Generate unique route ID.
        const controller = (0, uuid_1.v5)(target.constructor._loaderId, loader_1.LOADER_ROOT_ROUTE_NAMESPACE);
        const identifier = (0, uuid_1.v5)(functionName, controller);
        if (loader_1.activeLoader) {
            loader_1.default.loadRoute({
                identifier,
                controller,
                method,
                path,
                handler,
                middleware: []
            });
        }
        else
            throw new Error("Failed to identify the active loader.");
    };
}
exports.default = Route;
