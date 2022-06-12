import { CinnamonPlugin } from "../../sdk/cinnamon-plugin";
import { CinnamonWebServerModulePlugin } from "../../modules/web-server";
import Cinnamon, { Context, Next, WebServer } from "../../index";
import sendFile from "../../modules/web-server/lib/files";

import cinnamonInternals from "@apollosoftwarexyz/cinnamon-internals";

type ServeStaticPreprocessor = (ctx: Context) => Promise<void>;

interface ServeStaticOptions {
    /**
     * The root directory that should be served from, relative to the project root.
     */
    root?: string;

    /**
     * Whether directory index files should be supported.
     * Default: true
     */
    index?: boolean;

    /**
     * The list of files that can be considered a directory index.
     * Whichever matches first will be used.
     *
     * Defaults to: ["index.html", "index.htm"]
     */
    indexFiles?: string[];

    /**
     * The list of extensions that should be checked for a file.
     * e.g., if this contains 'html', a request for /hello would also cause /hello.html to be
     * checked if a /hello/ directory did not exist.
     *
     * Ignored if not specified.
     */
    optionalExtensions?: string[];

    /**
     * Similar to {@link optionalExtensions} but returns a 404 if the extension is explicitly
     * specified.
     *
     * Ignored if not specified.
     */
    extensionless?: string[];

    /**
     * Whether hidden files should be prevented from being transferred.
     * Default: true
     */
    ignoreHiddenFiles?: boolean;

    /**
     * The list of preprocessors to apply to any files. Each takes a Cinnamon request
     * context, ({@link Context}). They will be executed sequentially in the order they
     * appear in the list (first in list = first executed).
     *
     * Ignored if not specified.
     */
    preprocess?: ServeStaticPreprocessor[];
}

/**
 * Cinnamon Web Server plugin that serves a static directory.
 */
export class ServeStatic extends CinnamonPlugin
implements CinnamonWebServerModulePlugin {

    private options: ServeStaticOptions;

    public constructor(framework: Cinnamon, options?: ServeStaticOptions) {
        super(framework, "xyz.apollosoftware", "cinnamon.static");

        this.options = cinnamonInternals.data.mergeObjectDeep({
            root: './static',
            index: true,
            indexFiles: ["index.html", "index.htm"],
            extensionless: false,
            ignoreHiddenFiles: true,
        }, options ?? {});
    }


    public async onInitialize(): Promise<boolean | void> {
        if (
            !(await cinnamonInternals.fs.directoryExists(this.options.root!))
        ) {
            this.framework.logger.error(`Missing static directory: ${this.options.root}`);
            return false;
        }

        return true;
    }

    async beforeRegisterControllers() {
        this.framework.getModule<WebServer>(WebServer.prototype).server.use(
            (ctx: Context, next: Next) => this.handleStaticRequest(ctx, async () => {
                // Execute preprocessors if there are any after the request has been handled.
                if (this.options.preprocess && this.options.preprocess.length > 0) {
                    for (const preprocessor of this.options.preprocess) {
                        await preprocessor(ctx);
                    }
                }

                // Then pass to any remaining middleware in the stack.
                return await next();
            })
        );
    }

    async handleStaticRequest(ctx: Context, next: Next) {
        // Check if any other handlers exist in the stack for this request.
        await next();

        // If we got an invalid request method for a static file, or if the
        // request was already handled, don't bother serving a static file.
        if (!['HEAD', 'GET'].includes(ctx.method)) return;
        if (ctx.body != null || ctx.status !== 404) return;

        // Otherwise, we'll attempt to send the static file.
        await sendFile(ctx, ctx.path, {
            root: this.options.root!,
            index: this.options.index,
            indexFiles: this.options.indexFiles,
            optionalExtensions: this.options.optionalExtensions,
            extensionless: this.options.extensionless,
            ignoreHiddenFiles: this.options.ignoreHiddenFiles
        });
    }

}
