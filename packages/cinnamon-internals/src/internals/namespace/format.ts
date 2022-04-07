/**
 * @internal
 * @private
 * @module @apollosoftwarexyz/cinnamon-internals
 */

export namespace format {

    /**
     * A map of byte suffixes.
     * Converting these to byte multiples can be done as follows:
     * ```ts
     * Math.pow(1024, BYTES_SUFFIXES.indexOf(unit))
     * ```
     */
    const BYTES_SUFFIXES = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

    /**
     * A regular expression that matches a decimal integer numeral,
     * followed by a byte suffix.
     *
     * This only respects decimal units, i.e., KB, MB rather than
     * KiB, MiB, however the library will return multiples of 1024,
     * rather than 1000.
     *
     * These are to be used for function parameters or human-readable
     * options, rather than high-precision which is why this is
     * considered acceptable.
     */
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
