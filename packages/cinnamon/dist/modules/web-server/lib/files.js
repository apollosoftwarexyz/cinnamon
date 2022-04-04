"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FileSystem = require("fs");
const Path = require("path");
const util_1 = require("util");
const cinnamon_internals_1 = require("@apollosoftwarexyz/cinnamon-internals");
async function sendFile(ctx, path, options) {
    options = cinnamon_internals_1.default.data.mergeObjectDeep({
        index: true,
        indexFiles: ["index.html", "index.htm"],
        maxAge: 0,
        immutable: false,
        ignoreHiddenFiles: true
    }, options);
    try {
        path = decodeURIComponent(path);
        path = path.substring(Path.parse(path).root.length, path.length);
    }
    catch (ex) {
        throw new cinnamon_internals_1.default.error.HttpError('Invalid path', 400);
    }
    // If the path is empty, resolve the root directory instead.
    if (path === '' && ctx.path === '/')
        path = './';
    let target = cinnamon_internals_1.default.fs.resolveAbsolutePath(options.root, path);
    // If hidden files is turned off and the user requested a hidden file, ignore the request.
    if (options.ignoreHiddenFiles && Path.basename(target).startsWith('.'))
        return;
    // If index is turned on and the user requested a directory...
    if (options.index) {
        if (ctx.path.endsWith('/') || await cinnamon_internals_1.default.fs.directoryExists(target)) {
            // Attempt to find the index file.
            for (let indexName of options.indexFiles) {
                if (await cinnamon_internals_1.default.fs.fileExists(Path.join(target, indexName))) {
                    target = Path.join(target, indexName);
                    break;
                }
            }
        }
    }
    if (!(await cinnamon_internals_1.default.fs.fileExists(target))) {
        // If extensions is enabled and the basename doesn't include an extension,
        // check each of those before we error out.
        if (options.extensions && !Path.basename(target).includes('.')) {
            let didFindExtension = false;
            // Check each extension.
            for (let extension of options.extensions) {
                let potentialFile = `${target}.${extension}`;
                if (await cinnamon_internals_1.default.fs.fileExists(potentialFile)) {
                    target = potentialFile;
                    didFindExtension = true;
                    break;
                }
            }
            // Throw an error if none of the extensions worked either.
            if (!didFindExtension)
                throw new cinnamon_internals_1.default.error.HttpError('File not found', 404);
        }
        // Otherwise, error out straight away.
        else {
            throw new cinnamon_internals_1.default.error.HttpError('File not found', 404);
        }
    }
    // If we're here, the file must exist, so send it down.
    const stat = await (0, util_1.promisify)(FileSystem.stat)(target);
    ctx.set('Content-Length', stat.size.toString());
    ctx.set('Last-Modified', stat.mtime.toUTCString());
    ctx.set('Cache-Control', [
        `max-age=${(options.maxAge ?? 0) / 1000 | 0}`,
        options.immutable ? 'immutable' : undefined,
    ].filter(entry => !!entry).join(','));
    ctx.type = Path.basename(target);
    ctx.body = FileSystem.createReadStream(target);
}
exports.default = sendFile;
