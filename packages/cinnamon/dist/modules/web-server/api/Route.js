"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const loader_1 = __importStar(require("../loader"));
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
        const handler = descriptor === null || descriptor === void 0 ? void 0 : descriptor.value;
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
