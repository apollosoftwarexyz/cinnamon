/// <reference types="koa" />
import { CinnamonPlugin } from "../../sdk/cinnamon-plugin";
import { CinnamonWebServerModulePlugin } from "../../modules/web-server";
import Cinnamon, { Context, Next } from "../../index";
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
    extensions?: string[];
    /**
     * Whether hidden files should be prevented from being transferred.
     * Default: true
     */
    ignoreHiddenFiles?: boolean;
}
/**
 * Cinnamon Web Server plugin that serves a static directory.
 */
export declare class ServeStatic extends CinnamonPlugin implements CinnamonWebServerModulePlugin {
    private options;
    constructor(framework: Cinnamon, options?: ServeStaticOptions);
    onInitialize(): Promise<boolean | void>;
    beforeRegisterControllers(): Promise<void>;
    handleStaticRequest(ctx: Context, next: Next): Promise<void>;
}
export {};
