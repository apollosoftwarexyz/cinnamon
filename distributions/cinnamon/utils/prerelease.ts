/*
 * Runs pre-release checks to ensure the package is ready for distribution.
 */

// @ts-ignore - ignore warning for JSON file imports as it's overridden for the script.
import workspacePackageConfig from '../package.json';
// @ts-ignore - ignore warning for JSON file imports as it's overridden for the script.
import distributionPackageConfig from '../package.json';

import * as chalk from 'chalk';
import { CINNAMON_CORE_DEBUG_MODE } from "@apollosoftwarexyz/cinnamon-core";

//// CLI Arguments.
const onlyFailures = process.argv.includes('--only-failures');

//// Data.
const checkStats = {
    total: 0,
    pass: 0,
    fail: 0,
};

//// Helper methods.
function _invertAssertion(message: string) {
    if(message.match(/is (?!not)/g))
        return message.replace(/is (?!not)/g, "is not ");
    else
        return message.replace(/(is not )/g, "is ");
}

function pass(message: string) {
    if (!onlyFailures) console.log(chalk.greenBright("\n\t\u2705 \t") + chalk.blackBright.bgGreenBright.bold("  PRE-RELEASE CHECK PASS  ") + chalk.greenBright(` ${message}`));
    checkStats.pass++;
}

function fail(message: string) {
    console.error(chalk.redBright("\n\t\u274C \t") + chalk.bgRed.whiteBright.bold("  PRE-RELEASE CHECK FAIL  ") + chalk.redBright(` ${message}`));
    checkStats.fail++;
}

async function check(assertion: string, check: () => Promise<boolean>, messages?: {
    passMessage?: string | (string | undefined)[],
    failMessage?: string | (string | undefined)[],
}) {
    let passMessage = messages?.passMessage;
    let failMessage = messages?.failMessage;

    if (passMessage instanceof Array) {
        if (!passMessage[0]) passMessage[0] = assertion;
        passMessage = passMessage.join("\n\t\t");
    } else passMessage = passMessage ?? assertion;

    if (failMessage instanceof Array) {
        if (!failMessage[0]) failMessage[0] = _invertAssertion(assertion);
        failMessage = failMessage.join("\n\t\t(!) ")
    } else failMessage = failMessage ?? _invertAssertion(assertion);

    await check()
        .then((status) => {
            checkStats.total++;
            status ? pass(passMessage as string) : fail(failMessage as string)
        }).catch((failure) => fail(failure));
}

//// Script start.
(async () => {
    console.log("Running Cinnamon Framework pre-release checks...");
    console.log("*** This is a tool intended for framework developers when preparing a release. ***");
    console.log("*** If that's not your goal, please disregard the output of this tool as irrelevant. ***");

    await check("Cinnamon's core is not in debug mode", async () => !CINNAMON_CORE_DEBUG_MODE, {
        failMessage: [,
            "The core must not be in debug mode for releases.",
            "Please set CINNAMON_CORE_DEBUG_MODE to false in packages/core/src/main.ts."
        ]
    });

    await check("Workspace version matches package version", async () => workspacePackageConfig.version === distributionPackageConfig.version, {
        failMessage: [,
            "The workspace version (@apollosoftwarexyz/cinnamon-workspaces) must match the distribution package version.",
            "Please check that the version property of the workspace's package.json (i.e, the one at the repository root)",
            "matches the version property of the distribution's package.json (i.e., the one located in /distributions/cinnamon)"
        ]
    });

    console.log("\n" + [
        "Finished performing pre-release checks.",
        "",
        `# Checks Passed:\t${checkStats.pass}`,
        `# Checks Failed:\t${checkStats.fail}`,
        `Total Checks Run:\t${checkStats.total}`,
        "",
        checkStats.fail == 0
            ? chalk.greenBright(["Cinnamon has passed the pre-release checks and is ready for release."].join('\n'))
            : chalk.redBright([
                "Cinnamon failed one or more pre-release checks.",
                onlyFailures
                    ? "Please rectify the above failed checks."
                    : "Please identify and rectify the failed checks, or run yarn prepublishOnly --only-failures"
            ].join('\n'))
    ].join("\n"));

    if (checkStats.fail > 0) process.exit(1);
})();
