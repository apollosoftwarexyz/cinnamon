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
export declare namespace data {
    /**
     * Used to delimit between nested objects in an object key,
     *
     * @see resolveObjectDeep
     * @see setObjectDeep
     */
    const NESTED_OBJECT_DELIMITER = ".";
    /**
     * Compares two arrays to check if they are equal in terms of the values
     * they hold, out of order.
     * @param a An array to check.
     * @param b The array to check against the other array.
     * @return {boolean} isArrayEqual - true if the arrays contain the same
     * values and only the same values, false if not.
     */
    function arrayEquals(a: any[], b: any[]): boolean;
    function resolveObjectDeep(key: string, obj: {
        [key: string]: any;
    }): any;
    function setObjectDeep(key: string, value: any, obj: {
        [key: string]: any;
    }, options?: {
        createChildrenIfNeeded: boolean;
    }, _entireKey?: string): void;
    function mergeObjectDeep(target: any, source: any): any;
}
