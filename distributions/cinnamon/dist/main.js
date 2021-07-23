"use strict";
/**
 * Cinnamon main distribution package.
 * Be sure to export all production files/APIs/classes in this distribution package.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinnamonModule = void 0;
////////////////
// Framework Core.
////////////////
const cinnamon_core_1 = require("@apollosoftwarexyz/cinnamon-core");
Object.defineProperty(exports, "CinnamonModule", { enumerable: true, get: function () { return cinnamon_core_1.CinnamonModule; } });
exports.default = cinnamon_core_1.default;
////////////////
// Framework Modules.
////////////////
__exportStar(require("@apollosoftwarexyz/cinnamon-core-modules"), exports);
