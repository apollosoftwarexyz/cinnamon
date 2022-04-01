"use strict";
/**
 * @module @apollosoftwarexyz/cinnamon-core-internals
 * @internal
 * @private
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fs = void 0;
const _fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
/**
 * Part of {@link cinnamonInternals}.
 *
 * @internal
 * @private
 */
var fs;
(function (fs) {
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
     * Returns true if the directory exists, or  false otherwise.
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
