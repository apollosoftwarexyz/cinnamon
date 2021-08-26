import * as _fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';

export namespace fs {
    /**
     * Checks whether a file exists at the specified path, by 'stat'-ing the filePath to check if a FileSystem node exists
     * at that path and if, indeed, it is a file.
     *
     * Returns true if the file exists, or false otherwise.
     *
     * @param filePath The file path to check.
     */
    export async function fileExists(filePath: string): Promise<boolean> {
        try {
            const stats = await promisify(_fs.stat)(filePath);
            return stats.isFile();
        } catch (ex) {
            return false;
        }
    }

    /**
     * Similar to {@see fileExists} but instead checks if the specified path is a directory, after checking
     * whether the FileSystem node exists.
     *
     * Returns true if the directory exists, or  false otherwise.
     *
     * @param directoryPath The directory path to check.
     */
    export async function directoryExists(directoryPath: string): Promise<boolean> {
        try {
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
    export function toAbsolutePath(childPath: string): string {
        return path.join(process.cwd(), childPath);
    }
}
