"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadUnless = exports.LoadIf = void 0;
const loader_1 = require("../loader");
/**
 * If applied to a controller, the controller will only be loaded if the
 * specified {@link predicate} resolves to true. This is evaluated at
 * load time and not evaluated after that, unless the controllers are
 * reloaded (essentially never re-evaluated in production).
 *
 * @param predicate A(n) (async) function that must resolve to true, for
 * the controller to be loaded.
 *
 * @see LoadUnless
 */
function LoadIf(predicate) {
    return function (target) {
        const shouldLoad = predicate();
        if (!loader_1.activeLoader)
            throw new Error("Failed to identify the active loader.");
        // If the _loaderId was empty, we're either operating on an invalid object
        // or the controller is empty, in which case the user will be warned and
        // the controller won't be loaded anyhow.
        if (!target._loaderId)
            return;
        if (target._loaderActivatedController && !shouldLoad) {
            throw new Error("A LoadIf was specified on a controller that was already loaded, yet it indicated that the controller should not have been loaded.\n" +
                "Make sure you've applied @LoadIf underneath @Controller (so that it loads before the controller.)");
        }
        target._loaderIgnored = !shouldLoad;
    };
}
exports.LoadIf = LoadIf;
/**
 * A syntactic sugar for the inverse of the {@link LoadIf} annotation.
 *
 * @param predicate A(n) (async) function where, if it resolves to true, the
 * controller will not be loaded.
 *
 * @see LoadIf
 */
function LoadUnless(predicate) {
    return LoadIf(() => !predicate());
}
exports.LoadUnless = LoadUnless;
