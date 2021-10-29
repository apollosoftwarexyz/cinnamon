#!/usr/bin/env ts-node

import chalk from 'chalk';
import cliPackage from '../package.json';
import cinnamonPackage from '../cinnamonPackage.json';
import printHelp from "./help";
import getCinnamonRoot from "./cinnamon";

(async () => {

    // Display welcome banner.
    console.log(chalk.magentaBright.bold(`Cinnamon v${cinnamonPackage.version} \u2022 Cinnamon CLI v${cliPackage.version}`));
    console.log(chalk.bold(`Created with \u2764 by Apollo Software Limited. MIT License.`));
    console.log();

    // Start processing arguments. If there are none, display help and exit.
    process.argv = process.argv.slice(2);
    if (process.argv.length < 1) {
        printHelp();
        return 0;
    }

    // Otherwise, proceed to attempt to locate the project and load
    // Cinnamon's configuration.
    let cinnamonRoot = await getCinnamonRoot();
    if (cinnamonRoot === undefined) {
        console.error(chalk.redBright("You must execute the Cinnamon CLI from within a Cinnamon project at this time."));
        console.error(chalk.redBright("This will change in the future, once we introduce project generators."));
        return 1;
    }

    // Finally, attempt to process the command.
    const command = process.argv[0];
    process.argv.shift();

    switch (command) {
    }

    printHelp('Unknown command.');
    return 1;

})().then((exitCode) => process.exit(exitCode));
