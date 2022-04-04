"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const loader_1 = require("../loader");
const logger_1 = require("../../logger");
/**
 * Registers a class as a Cinnamon API controller.
 * Each entry in the 'group' array is a 'directory' in the path that each
 * member of this controller will be prefixed with. For example, if the
 * group is ['api', 'v1', 'example'], each route in the controller will
 * be prefixed with /api/v1/example from the base URL of the web server.
 *
 * @param group The API 'group' this controller belongs to.
 */
function Controller(...group) {
    return function (target) {
        if (!loader_1.activeLoader)
            throw new Error("Failed to identify the active loader.");
        if (!target._loaderId) {
            loader_1.activeLoader.framework.getModule(logger_1.default.prototype).warn(`Empty controller ${target.name} detected. Skipping loading.`);
            return;
        }
        if (target._loaderIgnored) {
            return;
        }
        // Gather class data.
        const classIdentifier = target._loaderId;
        const controller = (0, uuid_1.v5)(classIdentifier, loader_1.LOADER_ROOT_ROUTE_NAMESPACE);
        loader_1.default.loadController(controller, group, target);
    };
}
exports.default = Controller;
