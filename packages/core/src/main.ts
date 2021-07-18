import * as fs from 'fs';
import { parse as parseToml } from 'toml';
import { promisify } from 'util';
import { fileExists } from "./_utils/fs";

export default class Cinnamon {

    static async initialize() : Promise<Cinnamon> {
        // Stat cinnamon.toml to make sure it exists.
        // This doubles as making sure the process is started in the project root.
        if (!await fileExists(('./cinnamon.toml'))) {
            console.error(`(!) cinnamon.toml not found in ${process.cwd()}`);
            console.error(`(!) Please make sure your current working directory is the project's root directory and that your project's cinnamon.toml exists.`);
            return process.exit(1);
        }

        // If the file exists, we're ready to load cinnamon.toml, and to process and validate the contents.
        console.log("Initializing Apollo Framework...");
        const projectConfigFile = (await promisify(fs.readFile)('./cinnamon.toml', 'utf-8'));

        let projectConfig;
        try {
            projectConfig = parseToml(projectConfigFile);
        } catch(ex) {
            console.error(`(!) Failed to parse cinnamon.toml:`);
            console.error(`(!) ...parsing failed on line ${ex.line}, at column ${ex.column}: ${ex.message}`);
            return process.exit(2);
        }

        const framework = new Cinnamon();
        return framework;
    }

}
