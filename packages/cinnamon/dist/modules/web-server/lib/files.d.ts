import { Context } from "../../../index";
export interface SendFileOptions {
    /**
     * The root directory that should be served from, relative to the project root.
     */
    root: string;
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
     * The max-age that the browser should cache the file for, in milliseconds.
     * Default: 0
     */
    maxAge?: number;
    /**
     * Tells the browser that the resource is immutable and can be cached indefinitely.
     * Default: false
     */
    immutable?: boolean;
    /**
     * Whether hidden files should be prevented from being transferred.
     * Default: true
     */
    ignoreHiddenFiles?: boolean;
}
export default function sendFile(ctx: Context, path: string, options: SendFileOptions): Promise<void>;
