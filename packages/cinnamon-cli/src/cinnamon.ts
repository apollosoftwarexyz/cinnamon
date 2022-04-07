import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

/**
 * Checks whether the current working directory is a Cinnamon project, or if it is
 * contained in one by checking for 'cinnamon.toml' recursively.
 *
 * Returns the Cinnamon root directory as an absolute file path if it is, otherwise
 * returns undefined.
 */
export default async function getCinnamonRoot() : Promise<string | undefined> {
    const rootPath = (process.platform == "win32") ? process.cwd().split(path.sep)[0] : "/";
    let currentPath = await promisify(fs.realpath)(process.cwd());

    const hasCinnamonToml = async (dir: string) : Promise<boolean> => {
        try {
            return (await promisify(fs.stat)(path.join(dir, 'cinnamon.toml'))).isFile();
        } catch(ex) {
            return false;
        }
    }

    let checkedDirs = 0;
    while (currentPath != rootPath && checkedDirs < 10) {
        if (await hasCinnamonToml(currentPath)) return currentPath;

        currentPath = await promisify(fs.realpath)(path.join(currentPath, '../'));
        checkedDirs++;
    }

    return undefined;
}
