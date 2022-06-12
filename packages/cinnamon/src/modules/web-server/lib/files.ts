import * as FileSystem from 'fs';
import * as Path from 'path';
import { promisify } from 'util';

import { Context } from "../../../index";

import cinnamonInternals from "@apollosoftwarexyz/cinnamon-internals";

/**
 * Options that may be specified when using `sendFile` to respond to a request with
 * a file.
 */
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
    optionalExtensions?: string[];

    /**
     * Similar to {@link optionalExtensions} but returns a 404 if the extension is explicitly
     * specified.
     *
     * Ignored if not specified.
     */
    extensionless?: string[];

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

export default async function sendFile(ctx: Context, path: string, options: SendFileOptions) {
    options = cinnamonInternals.data.mergeObjectDeep({
        index: true,
        indexFiles: ["index.html", "index.htm"],
        maxAge: 0,
        immutable: false,
        ignoreHiddenFiles: true
    }, options);

    try {
        path = decodeURIComponent(path);
        path = path.substring(Path.parse(path).root.length, path.length);
    } catch(ex) {
        throw new cinnamonInternals.error.HttpError('Invalid path', 400);
    }

    // If the path is empty, resolve the root directory instead.
    if (path === '' && ctx.path === '/') path = './';

    let target = cinnamonInternals.fs.resolveAbsolutePath(options.root, path);

    // If hidden files is turned off and the user requested a hidden file, ignore the request.
    if (options.ignoreHiddenFiles && Path.basename(target).startsWith('.')) return;

    // If extensionless is enabled and the basename DOES include an extension, throw a 404 if the extension is
    // included in extensionless.
    if (options.extensionless && options.extensionless.length > 0 && Path.basename(target).includes('.')) {
        for (const invalidExtension of options.extensionless) {
            if (Path.extname(target) == `.${invalidExtension}`)
                throw new cinnamonInternals.error.HttpError('File not found', 404);
        }
    }

    // If index is turned on and the user requested a directory...
    if (options.index) {
        if (ctx.path.endsWith('/') || await cinnamonInternals.fs.directoryExists(target)) {

            // Attempt to find the index file.
            for (let indexName of options.indexFiles!) {
                if (await cinnamonInternals.fs.fileExists(Path.join(target, indexName))) {
                    target = Path.join(target, indexName);
                    break;
                }
            }

        }
    }

    if (!(await cinnamonInternals.fs.fileExists(target))) {

        const automaticExtensions = (options.optionalExtensions || options.extensionless) ?
            cinnamonInternals.data.arrayUnique([
                ...(options.optionalExtensions ?? []),
                ...(options.extensionless ?? [])
            ]) : undefined;

        // If extensions is enabled and the basename doesn't include an extension,
        // check each of those before we error out.
        if (automaticExtensions && automaticExtensions.length > 0 && !Path.basename(target).includes('.')) {

            let didFindExtension = false;

            // Check each extension.
            for (let extension of automaticExtensions!) {
                let potentialFile = `${target}.${extension}`;
                if (await cinnamonInternals.fs.fileExists(potentialFile)) {
                    target = potentialFile;
                    didFindExtension = true;
                    break;
                }
            }

            // Throw an error if none of the extensions worked either.
            if (!didFindExtension)
                throw new cinnamonInternals.error.HttpError('File not found', 404);

        }

        // Otherwise, error out straight away.
        else {
            throw new cinnamonInternals.error.HttpError('File not found', 404);
        }

    }

    // If we're here, the file must exist, so send it down.
    const stat = await promisify(FileSystem.stat)(target);
    ctx.set('Content-Length', stat.size.toString());
    ctx.set('Last-Modified', stat.mtime.toUTCString());
    ctx.set('Cache-Control', [
        `max-age=${(options.maxAge ?? 0) / 1000 | 0}`,
        options.immutable ? 'immutable' : undefined,
    ].filter(entry => !!entry).join(','));

    ctx.type = Path.basename(target);
    ctx.body = FileSystem.createReadStream(target);
}
