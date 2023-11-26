import { ArgumentOrStateError } from './error';

/**
 * When decorating a class property with this decorator, the property will
 * be set to the value provided on the prototype of the class.
 *
 * Source: https://stackoverflow.com/a/69698955/2872279
 * @param value The value to decorate with.
 */
export function prototype<T>(value: T) {
    return function (target: any, key: any) {
        target[key] = value;
    };
}

/**
 * Used to delimit between nested objects in an object key,
 *
 * @see resolveObjectDeep
 * @see setObjectDeep
 */
export const NESTED_OBJECT_DELIMITER = '.';

/**
 * Returns a new array with any redundant (duplicate) values from the original
 * array removed. (Equivalent to casting to a Set and back to an array, but
 * with some optimizations.)
 *
 * This function aims to be a general-purpose performant solution for removing
 * duplicates from an array. In general, when the array is expected to have
 * many duplicates, it is faster to copy the values into a new array after
 * checking if they exist in the new array, rather than using a Set.
 *
 * For arrays with few duplicates, particularly when there are lots of values,
 * it is faster to use a Set.
 *
 * This function uses a heuristic to determine whether to use a Set or not -
 * if the array has more than 30 elements and the caller does not expect many
 * duplicates as specified by `expectManyDuplicates`, it will use a Set.
 * Otherwise, it will use a for-each loop with `includes`.
 *
 * @param array The array to remove duplicates from.
 * @param expectManyDuplicates Whether the caller expects many duplicates in
 * the array. Defaults to false.
 */
export function arrayUnique(array: any[], expectManyDuplicates: boolean = false) : any[] {
    // In v8 and WebKit's JavaScript engine, using Set is faster when the
    // elements are randomly distributed and when there are more than 30
    // elements. Otherwise, doing a manual for-each loop with includes is
    // faster.
    if (array.length > 30 && !expectManyDuplicates) {
        return [...new Set(array)];
    }

    const result = [];
    for (const element of array) {
        if (!result.includes(element)) result.push(element);
    }
    return result;
}

/**
 * Compares two arrays to check if they are equal in terms of the values
 * they hold, out of order.
 *
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

/**
 * Given an object and a deep key, returns the immediate key to look up in
 * the object, the remaining key parts, and whether this is the final key
 * to look up in the object or if there is further nesting.
 *
 * @param obj The object to look up the key in.
 * @param key The key to look up in the object.
 */
function resolveImmediateKey(obj: Record<string, any>, key: string) {
    if (typeof obj !== 'object' || obj === null || obj === undefined) {
        throw new TypeError('Cannot deep-resolve a key in a non-object.');
    }

    if (typeof key !== 'string') {
        throw new TypeError('Cannot deep-resolve a non-string key.');
    }

    // Split the key into parts, denoted by a period (.).
    const keyParts = key.split(NESTED_OBJECT_DELIMITER);

    // Check if this is the final part of the key to look up in the object.
    // Yes = there is only one part which would be the immediate key, No =
    // there are other parts, so we need to keep digging in the object.
    const isFinalKey = keyParts.length <= 1;

    // Get the first part of the key (= 'immediate' part).
    // This is the part we're immediately looking up in the object.
    //
    // We explicitly cast this to a string, because we know the key cannot
    // be empty.
    const immediateKey = keyParts.shift() as string;

    if (immediateKey === '__proto__' || immediateKey === 'constructor' || immediateKey === 'prototype') {
        throw new ArgumentOrStateError(`Cannot deep-resolve a key that is a prototype property: ${key}`);
    }

    return { keyParts, isFinalKey: isFinalKey, immediateKey };
}

/**
 * Resolves a value in an object by a key, where the key can be a nested
 * object key, delimited by the {@link NESTED_OBJECT_DELIMITER} character.
 * (By default, this is a period: .)
 *
 * The key must be a string, and the object must be an object (not null or
 * undefined). Otherwise, a TypeError will be thrown. (A {@link TypeError}
 * is thrown instead of a {@link ArgumentOrStateError} because this is
 * consistent with the behavior of `Object.keys` and because these should be
 * checked beforehand by the caller so clearer error messages can be
 * provided.)
 *
 * Additionally, {@link ArgumentOrStateError} is for when the argument is just
 * not valid in this particular context (e.g., in {@link setObjectDeep} when
 * a parent object of the desired key cannot be located), whereas
 * {@link TypeError} is for when the argument is just not valid in general
 * such as when the key is not a string).
 *
 * @param key The key to look up in the object.
 * @param obj The object to look up the key in.
 */
export function resolveObjectDeep(key: string, obj: Record<string, any>) : any {
    const { keyParts, isFinalKey, immediateKey } =
        resolveImmediateKey(obj, key);

    // Return undefined if the key can't be obtained.
    if (!Object.keys(obj).includes(immediateKey)) return undefined;

    // Return the value immediately if this is the final key, otherwise
    // recurse with the next part of the key and the child of the object
    // at our imperative key.
    // (We can simply join keyParts by a period because our shift operation
    // above actually removed the imperative key from the key parts.)
    if (isFinalKey) return obj[immediateKey];
    else return resolveObjectDeep(
        keyParts.join(NESTED_OBJECT_DELIMITER),
        obj[immediateKey]
    );
}

/**
 * Sets a value in an object by a key, where the key can be a nested object
 * key, delimited by a period (.).
 *
 * The object is modified in-place.
 *
 * The `createChildrenIfNeeded` option can be used to specify whether to
 * create children if they don't exist. If this is set to false, an error
 * will be thrown if the key cannot be located in the object. This is akin to
 * `mkdir -p` in Unix.
 *
 * The `overwriteParentIfNeeded` option can be used to specify whether to
 * overwrite a non-object value with an object if a descendent is created.
 * This is useful for when you want to set a value in an object, but a
 * parent of the value is not an object. If this is set to false, an error
 * will be thrown if a parent of the value is not an object.
 *
 * The `_entireKey` parameter is set by the function itself during recursion
 * and should not be set by the caller.
 *
 * @param key The key to look up in the object.
 * @param value The value to set the key to.
 * @param obj The object to look up the key in.
 * @param options Options for the set operation.
 * @param _entireKey The entire key, used for error messages (recursion).
 */
export function setObjectDeep(
    key: string,
    value: any,
    obj: Record<string, any>,
    options?: {
        createChildrenIfNeeded?: boolean,
        overwriteParentIfNeeded?: boolean
    },
    _entireKey?: string
) {
    options = Object.assign({
        createChildrenIfNeeded: true,
        overwriteParentIfNeeded: true,
    }, options ?? {});
    _entireKey ??= key;

    const { keyParts, isFinalKey, immediateKey } = resolveImmediateKey(obj, key);

    // Throw an error if the key can't be obtained.
    if (!Object.keys(obj).includes(immediateKey)) {
        if (!options.createChildrenIfNeeded) {
            throw new ArgumentOrStateError(`Failed to define key: ${_entireKey}.`);
        } else obj[immediateKey] = Object.create(null);
    }

    // If the value is not an object and overwriteParentIfNeeded is true, then
    // overwrite the parent with an object.
    if (!isFinalKey && typeof obj[immediateKey] !== 'object') {
        if (options.overwriteParentIfNeeded) {
            obj[immediateKey] = Object.create(null);
        } else {
            const fullImmediateKey = _entireKey
                .split(NESTED_OBJECT_DELIMITER)
                .slice(0, -keyParts.length)
                .join(NESTED_OBJECT_DELIMITER);

            throw new ArgumentOrStateError(
                `Failed to define key due to a conflict: "${_entireKey}".\n\n` +
                `An ancestor/parent of the key is not an object and 'overwriteParentIfNeeded' is set to false so it was not modified.\n` +
                `Specifically, "${fullImmediateKey}" is "${typeof obj[immediateKey]}" and not "object".\n\n` +
                `- To overwrite any non-object ancestors with objects, set 'overwriteParentIfNeeded' to true.\n` +
                `- Otherwise, double-check the key you are setting and that its parents are objects.\n\n`
            );
        }
    }

    // Either perform a direct set if this is the imperative key, or perform
    // a recursive set if necessary.
    if (isFinalKey) { obj[immediateKey] = value; return; } else setObjectDeep(
        keyParts.join(NESTED_OBJECT_DELIMITER),
        value,
        obj[immediateKey],
        options,
        _entireKey
    );
}

/**
 * Merges two objects together recursively, with the source object's values
 * taking precedence over the target object's values.
 *
 * This is similar to {@link Object.assign}, but performs a deep merge
 * instead of a shallow merge.
 *
 * This function is ideal for merging configuration objects together.
 *
 * If the source is invalid (undefined, null, or not an object), then a
 * {@link TypeError} will be thrown. Otherwise, if the target is invalid,
 * it will be replaced with a copy of the source (again, assuming the source
 * is valid).
 *
 * In any case, the returned object will either be the target object (if it
 * was valid) or a copy of the source object (if the target was invalid) and
 * never the source object itself. The source object will never be modified,
 * via the return value, or within this function.
 *
 * **Tip:** When merging a configuration object, you would put the default
 * configuration object as the target, and the user's configuration object
 * as the source. So the user's configuration object would take precedence
 * over the default configuration object as the source is merged *into* the
 * target.
 *
 * @param target The target object to merge into.
 * @param source The source object to merge from.
 */
export function mergeObjectDeep(target: any, source: any) : any {
    // If the source is invalid, throw an error.
    if (source === undefined || source === null || typeof source !== 'object') {
        throw new TypeError('Cannot merge a non-object into an object. (The source object in a deep-merge must be an object.)');
    }

    // If the target is non-existent or not specified, return a copy of the source.
    if (target === undefined || target === null) {
        return { ...source };
    }

    // If the target is present, but not an object, throw an error.
    if (typeof target !== 'object') {
        throw new TypeError('Cannot merge an object into a non-object. (The target object in a deep-merge must be null, undefined, or an object.)');
    }

    // Tests whether the given value is an object and is not undefined or null.
    const isObject = (x: any) =>
        x !== undefined &&
        x !== null &&
        typeof x === 'object' &&
        !Array.isArray(x);

    // Loop over each key of source, either deep merging if both target and
    // source at key are objects, or setting the target to the source if the
    // target is not an object.
    for (const key of Object.keys(source)) {
        // Skip prototype properties.
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            continue;
        }

        // If the current item in the source object is an object, and
        // it's not set or is an object in the target, then recursively
        // attempt to merge.
        if (isObject(target[key]) && isObject(source[key])) {
            target[key] = mergeObjectDeep(target[key], source[key]);
        } else if (!isObject(target[key])) {
            target[key] = source[key];
        }
    }

    return target;
}
