"use strict";
/**
 * @internal
 * @private
 * @module @apollosoftwarexyz/cinnamon-internals
 */
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("./namespace/error");
const data_1 = require("./namespace/data");
const fs_1 = require("./namespace/fs");
/**
 * @internal
 *
 * <br>
 *
 * ### Cinnamon Internal Namespaces
 *
 * These namespaces are intended for internal use by the Cinnamon framework and its core modules. Whilst they are,
 * strictly speaking, visible to external packages, their use for anything other than by the framework, internally, is
 * _highly discouraged_, because there are no guarantees made about their API surface or its stability or consistency.
 * These APIs are intended to be flexible for the organization of the internal framework only.
 *
 * <br>
 *
 * **TL;DR:** Do not use anything in this namespace if you're not working on a component of the framework itself.
 */
var cinnamonInternals;
(function (cinnamonInternals) {
    cinnamonInternals.error = error_1.error;
    cinnamonInternals.data = data_1.data;
    cinnamonInternals.fs = fs_1.fs;
})(cinnamonInternals || (cinnamonInternals = {}));
exports.default = cinnamonInternals;
