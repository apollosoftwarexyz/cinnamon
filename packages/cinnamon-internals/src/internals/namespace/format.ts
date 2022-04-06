/**
 * @module @apollosoftwarexyz/cinnamon-internals
 * @internal
 * @private
 */

export namespace format {

    const BYTES_SUFFIXES = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const BYTES_STRING_REGEXP = /^(\d+) *(B|KB|MB|GB|TB|PB)$/i;

    /**
     * Parses the specified value as a number of bytes.
     * @param value The string value to parse.
     */
    export function parseBytes(value: string) : number {
        const results = BYTES_STRING_REGEXP.exec(value);
        if (!results) {
            const naiveResult = parseInt(value, 10);
            if (isNaN(naiveResult)) throw new Error(`Failed to parse as a bytes string: ${value}`);
            else return naiveResult;
        }

        const bytesCount = parseInt(results[1]);
        const unit = results[2].toUpperCase();

        if (isNaN(bytesCount) || !BYTES_SUFFIXES.includes(unit))
            throw new Error(`Failed to parse as a bytes string: ${value}`);

        return bytesCount * Math.pow(1024, BYTES_SUFFIXES.indexOf(unit));
    }

}
