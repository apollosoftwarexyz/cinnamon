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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const loader_1 = __importStar(require("../loader"));
const logger_1 = __importDefault(require("../../logger"));
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
