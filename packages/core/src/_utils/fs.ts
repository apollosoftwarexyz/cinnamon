import {promisify} from "util";
import * as fs from "fs";

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
        const stats = await promisify(fs.stat)(filePath);
        return stats.isFile();
    } catch(ex) { return false; }
}
