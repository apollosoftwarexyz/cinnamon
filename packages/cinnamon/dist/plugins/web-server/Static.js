"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServeStatic = void 0;
const cinnamon_plugin_1 = require("../../sdk/cinnamon-plugin");
const index_1 = require("../../index");
const files_1 = require("../../modules/web-server/lib/files");
const cinnamon_internals_1 = require("@apollosoftwarexyz/cinnamon-internals");
// TODO: add templating engine support.
/**
 * Cinnamon Web Server plugin that serves a static directory.
 */
class ServeStatic extends cinnamon_plugin_1.CinnamonPlugin {
    options;
    constructor(framework, options) {
        super(framework, "xyz.apollosoftware", "cinnamon.static");
        this.options = cinnamon_internals_1.default.data.mergeObjectDeep({
            root: './static',
            index: true,
            indexFiles: ["index.html", "index.htm"],
            ignoreHiddenFiles: true
        }, options ?? {});
    }
    async onInitialize() {
        if (!(await cinnamon_internals_1.default.fs.directoryExists(this.options.root))) {
            this.framework.logger.error(`Missing static directory: ${this.options.root}`);
            return false;
        }
        return true;
    }
    async beforeRegisterControllers() {
        this.framework.getModule(index_1.WebServer.prototype).server.use((ctx, next) => this.handleStaticRequest(ctx, next));
    }
    async handleStaticRequest(ctx, next) {
        // Check if any other handlers exist in the stack for this request.
        await next();
        // If we got an invalid request method for a static file, or if the
        // request was already handled, don't bother serving a static file.
        if (!['HEAD', 'GET'].includes(ctx.method))
            return;
        if (ctx.body != null || ctx.status !== 404)
            return;
        // Otherwise, we'll attempt to send the static file.
        await (0, files_1.default)(ctx, ctx.path, {
            root: this.options.root,
            index: this.options.index,
            indexFiles: this.options.indexFiles,
            extensions: this.options.extensions,
            ignoreHiddenFiles: this.options.ignoreHiddenFiles
        });
    }
}
exports.ServeStatic = ServeStatic;
