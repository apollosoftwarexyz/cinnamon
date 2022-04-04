"use strict";
/**
 * @module @apollosoftwarexyz/cinnamon-internals
 * @internal
 * @private
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fs = void 0;
const _fs = require("fs");
const path = require("path");
const util_1 = require("util");
const error_1 = require("./error");
/**
 * Part of {@link cinnamonInternals}.
 *
 * @internal
 * @private
 */
var fs;
(function (fs) {
    const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;
    /**
     * Checks whether a file exists at the specified path, by 'stat'-ing the filePath to check if a FileSystem node exists
     * at that path and if, indeed, it is a file.
     *
     * Returns true if the file exists, or false otherwise.
     *
     * @param filePath The file path to check.
     */
    async function fileExists(filePath) {
        try {
            const stats = await (0, util_1.promisify)(_fs.stat)(filePath);
            return stats.isFile();
        }
        catch (ex) {
            return false;
        }
    }
    fs.fileExists = fileExists;
    /**
     * Similar to {@link fileExists} but instead checks if the specified path is a directory, after checking
     * whether the FileSystem node exists.
     *
     * Returns true if the directory exists, or false otherwise.
     *
     * @param directoryPath The directory path to check.
     */
    async function directoryExists(directoryPath) {
        try {
            if (typeof directoryPath !== "string")
                return false;
            const stats = await (0, util_1.promisify)(_fs.stat)(directoryPath);
            return stats.isDirectory();
        }
        catch (ex) {
            return false;
        }
    }
    fs.directoryExists = directoryExists;
    /**
     * Locates the specified path, relative to the current working directory, then resolves the
     * absolute path to that file.
     *
     * @param childPath The child of the current working directory to locate prior to determining the
     *                  absolute path.
     */
    function toAbsolutePath(childPath) {
        if (childPath === undefined || childPath === null)
            throw new Error("Missing path.");
        return path.join(process.cwd(), childPath);
    }
    fs.toAbsolutePath = toAbsolutePath;
    /**
     * Resolves the relative path, path, with respect to the rootPath.
     * Also protects against malicious paths designed to access files outside the
     * rootPath.
     *
     * @param rootPath The root path to resolve relative to.
     * @param relativePath The relative path to resolve.
     */
    function resolveAbsolutePath(rootPath, relativePath) {
        if (rootPath.indexOf('\0') !== -1 || path.isAbsolute(relativePath)) {
            throw new error_1.error.HttpError('Malicious path detected.');
        }
        if (UP_PATH_REGEXP.test(path.normalize(`.${path.sep}${relativePath}`))) {
            throw new error_1.error.HttpError('Malicious path detected.', 403);
        }
        return path.normalize(path.join(path.resolve(rootPath), relativePath));
    }
    fs.resolveAbsolutePath = resolveAbsolutePath;
    /**
     * Recursively lists the paths of files in a directory and its children.
     * A string list of the absolute paths of all the child files is returned.
     *
     * @param directoryPath The path of the root directory to search.
     */
    async function listRecursively(directoryPath) {
        let discoveredFiles = [];
        for (const filePath of await (0, util_1.promisify)(_fs.readdir)(directoryPath)) {
            const absoluteFilePath = path.join(directoryPath, filePath);
            // If the current 'file' is a directory, search _it_ recursively
            // with the same function.
            if ((await (0, util_1.promisify)(_fs.stat)(absoluteFilePath)).isDirectory())
                discoveredFiles.push(...await listRecursively(absoluteFilePath));
            // Otherwise, add the absolute file path we discovered to the list.
            else
                discoveredFiles.push(absoluteFilePath);
        }
        return discoveredFiles;
    }
    fs.listRecursively = listRecursively;
    /**
     * Returns the date the path was previously modified.
     *
     * @param path The path to get the modification date of.
     */
    async function getLastModification(path) {
        return (await (0, util_1.promisify)(_fs.stat)(path)).mtime;
    }
    fs.getLastModification = getLastModification;
})(fs = exports.fs || (exports.fs = {}));
