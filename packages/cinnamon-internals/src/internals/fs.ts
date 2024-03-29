import * as _fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { HttpError } from './error';

/**
 * A regex for an up-path. This would, for example, match a path with ../ in it, which would be
 * used to go to a parent directory. This is used to help block malicious paths.
 */
const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

/**
 * Checks whether a file exists at the specified path, by 'stat'-ing the filePath to check if a FileSystem node exists
 * at that path and if, indeed, it is a file.
 *
 * Returns true if the file exists, or false otherwise.
 *
 * @param filePath The file path to check.
 */
export async function fileExists(filePath: string) : Promise<boolean> {
    try {
        const stats = await promisify(_fs.stat)(filePath);
        return stats.isFile();
    } catch (ex) {
        return false;
    }
}

/**
 * Similar to {@link fileExists} but instead checks if the specified path is a directory, after checking
 * whether the FileSystem node exists.
 *
 * Returns true if the directory exists, or false otherwise.
 *
 * @param directoryPath The directory path to check.
 */
export async function directoryExists(directoryPath: string | undefined) : Promise<boolean> {
    try {
        if (typeof directoryPath !== 'string') return false;

        const stats = await promisify(_fs.stat)(directoryPath);
        return stats.isDirectory();
    } catch (ex) {
        return false;
    }
}

/**
 * Locates the specified path, relative to the current working directory, then resolves the
 * absolute path to that file.
 *
 * @param childPath The child of the current working directory to locate prior to determining the
 *                  absolute path.
 */
export function toAbsolutePath(childPath: string) : string {
    if (childPath === undefined || childPath === null) throw new Error('Missing path.');
    return path.join(process.cwd(), childPath);
}

/**
 * Locates the specified base, relative to the current working directory if it is not an absolute path, then
 * resolves the path of target relative to the base path.
 *
 * @param base The base path that {@link target} should be found relative to.
 * @param target The target path that should be converted to a relative path.
 * @return The path of target, relative to base.
 */
export function resolveRelativePath(base: string, target: string) : string {
    base = toAbsolutePath(base);
    if (!path.isAbsolute(target)) target = toAbsolutePath(target);

    return path.relative(base, target);
}

/**
 * Resolves a given relative path fragment based at the rootPath.
 * Also protects against malicious paths designed to access files outside the
 * rootPath.
 *
 * @param rootPath The root path to resolve relative to.
 * @param relativePath The relative path to resolve.
 */
export function resolveAbsolutePath(rootPath: string, relativePath: string) {
    if (relativePath.indexOf('\0') !== -1 || path.isAbsolute(relativePath)) {
        throw new HttpError('Malicious path detected');
    }

    if (UP_PATH_REGEXP.test(path.normalize(`.${path.sep}${relativePath}`))) {
        throw new HttpError('Malicious path detected', 403);
    }

    return path.normalize(path.join(path.resolve(rootPath), relativePath));
}

/**
 * Resolves the filename of the specified path.
 * @param filePath The path to resolve the filename of.
 */
export function resolveFilename(filePath: string) : string {
    return path.basename(filePath);
}

/**
 * Resolves the full extension of the specified filename. That is, if there are
 * multiple extension parts, they will all be returned.
 *
 * So, for example, if the filename is 'index.min.js', the full extension would
 * be 'min.js'. If the filename is 'index.js', the full extension would be
 * 'js'.
 *
 * If the filename has no extension, undefined will be returned.
 *
 * @param filePath The path (or filename) to resolve the full extension of.
 * @returns The full extension of the specified filename, or undefined if the
 *          filename has no extension.
 */
export function resolveFullExtension(filePath: string) : string | undefined {
    const filenameParts = resolveFilename(filePath).split('.');
    filenameParts?.shift();
    return filenameParts?.join('.');
}

/**
 * Recursively lists the paths of files in a directory and its children.
 * A string list of the absolute paths of all the child files is returned.
 *
 * @param directoryPath The path of the root directory to search.
 */
export async function listRecursively(directoryPath: string) : Promise<string[]> {

    const discoveredFiles = [];

    for (const filePath of await promisify(_fs.readdir)(directoryPath)) {
        const absoluteFilePath = path.join(directoryPath, filePath);

        // If the current 'file' is a directory, search _it_ recursively
        // with the same function.
        if ((await promisify(_fs.stat)(absoluteFilePath)).isDirectory())
            discoveredFiles.push(...await listRecursively(absoluteFilePath));
        // Otherwise, add the absolute file path we discovered to the list.
        else discoveredFiles.push(absoluteFilePath);
    }

    return discoveredFiles;

}

/**
 * Returns the date the path was previously modified.
 *
 * @param path The path to get the modification date of.
 */
export async function getLastModification(path: string) : Promise<Date> {
    return (await promisify(_fs.stat)(path)).mtime;
}
