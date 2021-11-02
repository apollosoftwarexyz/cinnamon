/**
 * @module @apollosoftwarexyz/cinnamon-core-internals
 * @internal
 * @private
 */

/**
 * Part of {@link cinnamonInternals}.
 *
 * @internal
 * @private
 */
export namespace data {

    /**
     * Used to delimit between nested objects in an object key,
     *
     * @see resolveObjectDeep
     * @see setObjectDeep
     */
    export const NESTED_OBJECT_DELIMITER = '.';

    /**
     * Compares two arrays to check if they are equal in terms of the values
     * they hold, out of order.
     * @param a An array to check.
     * @param b The array to check against the other array.
     * @return {boolean} isArrayEqual - true if the arrays contain the same
     * values and only the same values, false if not.
     */
    export function arrayEquals(a: any[], b: any[]) : boolean {
        // Immediately short-circuit if either isn't an array or the lengths are
        // different.
        if (!Array.isArray(a) || !Array.isArray(b)) return false;
        if (a.length !== b.length) return false;

        // Now compare the values in a with the values in b.
        let aValuesInB = [...a];
        b.forEach(element => {
            if (aValuesInB.includes(element))
                aValuesInB.splice(aValuesInB.indexOf(element), 1);
        });
        return aValuesInB.length === 0;
    }

    export function resolveObjectDeep(key: string, obj: {
        [key: string]: any
    }) : any {
        // Split the key into parts, denoted by the nested object delimeter - by
        // default a period (.).
        const keyParts = key.split(NESTED_OBJECT_DELIMITER);

        // Check if this is the final part of the key to look up in the object.
        // Yes = there is only one part which would be the imperative key, No =
        // there are other parts, so we need to keep digging in the object.
        const isFinalKey = keyParts.length <= 1;

        // Get the first part of the key (= 'imperative' part).
        // This is the part we're immediately looking up in the object.
        //
        // We explicitly cast this to a string, because we know the key cannot
        // be empty.
        const imperativeKey = keyParts.shift() as string;

        // Return undefined if the key can't be obtained.
        if (!Object.keys(obj).includes(imperativeKey)) return undefined;

        // Return the value immediately if this is the final key, otherwise
        // recurse with the next part of the key and the child of the object
        // at our imperative key.
        // (We can simply join keyParts by a period because our shift operation
        // above actually removed the imperative key from the key parts.)
        if (isFinalKey) return obj[imperativeKey];
        else return resolveObjectDeep(
            keyParts.join(NESTED_OBJECT_DELIMITER),
            obj[imperativeKey]
        );
    }

    export function setObjectDeep(key: string, value: any, obj: {
        [key: string]: any
    }, options?: {
        createChildrenIfNeeded: boolean
    }, _entireKey?: string) {
        if (!options) options = {
            createChildrenIfNeeded: true
        };

        // Split the key into parts, denoted by a period (.).
        const keyParts = key.split(NESTED_OBJECT_DELIMITER);

        // Check if this is the final part of the key to look up in the object.
        // Yes = there is only one part which would be the imperative key, No =
        // there are other parts, so we need to keep digging in the object.
        const isFinalKey = keyParts.length <= 1;

        // Get the first part of the key (= 'imperative' part).
        // This is the part we're immediately looking up in the object.
        //
        // We explicitly cast this to a string, because we know the key cannot
        // be empty.
        const imperativeKey = keyParts.shift() as string;

        // Throw an error if the key can't be obtained.
        if (!Object.keys(obj).includes(imperativeKey)) {
            if (!options.createChildrenIfNeeded) {
                throw new Error(`Failed to locate key: ${_entireKey}.`);
            } else obj[imperativeKey] = {};
        }

        // Either perform a direct set if this is the imperative key, or perform
        // a recursive set if neccessary.
        if (isFinalKey) { obj[imperativeKey] = value; return; }
        else setObjectDeep(
            keyParts.join(NESTED_OBJECT_DELIMITER),
            value,
            obj[imperativeKey],
            options,
            _entireKey
        );
    }

    export function mergeObjectDeep(target: any, source: any) : any {
        const isObject = (x: any) => x !== null && typeof x === 'object' && !Array.isArray(x);

        for (const key of Object.keys(source)) {
            // If the current item in the source object is an object, and
            // its not set or is an object in the target, then recursively
            // attempt to merge.
            if (isObject(source[key]) && isObject(target[key])) {
                target[key] = mergeObjectDeep(target[key], source[key]);
            } else if (!isObject(source[key]) && !isObject(target[key])) {
                target[key] = source[key];
            }
        }

        return target;
    }

}
