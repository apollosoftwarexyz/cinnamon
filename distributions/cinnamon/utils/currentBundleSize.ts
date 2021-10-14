/*
 * Checks the size of the current built bundle.
 */

// @ts-ignore - we're using esModuleInterop until ESM is ready.
import chalk from 'chalk';

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from "util";

const TARGET_BUNDLE_FILE = '../dist/index.cjs';

(async () => {
    let fileStat = await promisify(fs.stat)(
        path.join(__dirname, TARGET_BUNDLE_FILE)
    );

    console.log(`The current bundle size is ${chalk.greenBright(humanFileSize(fileStat.size, true))}`);
})();

///////////////////////////

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param useSiUnits True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param decimalPlaces Number of decimal places to display.
 *
 * @return humanFileSize Formatted string.
 */
function humanFileSize(bytes: number, useSiUnits = false, decimalPlaces: number = 1): string {
    const thresh = useSiUnits ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = useSiUnits
        ? ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10**decimalPlaces;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(decimalPlaces) + ' ' + units[u];
}
