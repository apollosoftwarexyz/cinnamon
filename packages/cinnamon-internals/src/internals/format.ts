/**
 * A map of byte suffixes.
 * Converting these to byte multiples can be done as follows:
 * ```ts
 * Math.pow(1024, BYTES_SUFFIXES.indexOf(unit))
 * ```
 */
const BYTES_SUFFIXES = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/**
 * A regular expression that matches a decimal integer numeral, followed by a
 * byte suffix.
 *
 * This only respects decimal units, i.e., KB, MB rather than KiB, MiB, however
 * the library will return multiples of 1024, rather than 1000.
 *
 * This also ignores 'bit' suffixes, i.e., Kb, Mb, etc.
 *
 * These are to be used for function parameters or human-readable options,
 * rather than high-precision which is why this is considered acceptable and as
 * these are often conflated, erring on the side of the larger value (and
 * historically correct value) is preferred.
 */
const BYTES_STRING_REGEXP = /^(\d+) *(B|KB|MB|GB|TB|PB)$/i;

/**
 * Parses the specified value as a number of bytes.
 * @param value The string value to parse.
 */
export function parseHumanReadableBytes(value: string) : number {
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

/**
 * Converts a string from UpperCamelCase to lower_snake_case (and friends).
 * This will convert to lower_snake_case by default, but can be configured
 * to convert to lower-kebab-case by setting skewer to '-'.
 *
 * Invalid characters will be removed.
 *
 * @param value The string to convert.
 * @param skewer The join character to use between words.
 */
export function toLowerCaseVariant(value: string, skewer: string = '_') {
    if (!value) return value;

    // Split the string into an array of characters.
    const chars = value.split('');

    // A regular expression that matches illegal characters.
    const ILLEGAL_CHARACTERS = /[^A-Za-z0-9]/;

    // Extract the first character.
    let firstChar: string;
    do {
        if (chars.length === 0) return '';
        firstChar = chars.shift().toLowerCase();
    } while (ILLEGAL_CHARACTERS.test(firstChar));

    // Join the remaining characters (without the first character).
    const transformed = chars.join('')
        // Strip illegal characters.
        .replace(new RegExp(ILLEGAL_CHARACTERS, 'g'), ' ')
        // Replace spaces with the skewer.
        .replace(/ /g, skewer)
        // Convert to lower_snake_case.
        .replace(/[A-Z]/g, (match) => `${skewer}${match.toLowerCase()}`)
        // Handle groups of numbers.
        .replace(/([A-Za-z]*)([0-9]+)([A-Za-z]*)/g, (_match, first, second, third) => `${first}${skewer}${second}${third}`)
        // Join contiguous skewers
        .replace(new RegExp(`${skewer}+`, 'g'), skewer);

    // Return the first character, plus the transformed string.
    return firstChar + transformed;
}

/** @see {@link fromUpperCamelCase} */
export const toLowerSnakeCase = (value: string) => toLowerCaseVariant(value, '_');

/** @see {@link fromUpperCamelCase} */
export const toLowerKebabCase = (value: string) => toLowerCaseVariant(value, '-');

/**
 * Converts a string from lower_snake_case (or lower-kebab-case) to
 * UpperCamelCase.
 *
 * Invalid characters will be removed.
 *
 * @param value The string to convert.
 */
export function toUpperCamelCase(value: string) {
    if (!value) return value;

    // Split the string into an array of characters.
    const chars = value.split('');

    // A regular expression that matches illegal characters.
    const ILLEGAL_CHARACTERS = /[^A-Za-z0-9]/;

    // Extract the first character.
    let firstChar: string;
    do {
        if (chars.length === 0) return '';
        firstChar = chars.shift().toUpperCase();
    } while (ILLEGAL_CHARACTERS.test(firstChar));

    // Join the remaining characters (without the first character).
    const transformed = chars.join('')
        // Strip illegal characters.
        .replace(new RegExp(ILLEGAL_CHARACTERS, 'g'), '_')
        // Reduce contiguous skewers to a single underscore.
        .replace(/[-_]+/g, '_')
        // Convert to UpperCamelCase.
        .replace(/_[a-z0-9]?/g, (match) => match[1]?.toUpperCase() ?? '');

    // Return the first character, plus the transformed string.
    return firstChar + transformed;
}
