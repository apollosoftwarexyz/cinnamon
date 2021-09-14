/**
 * Defines a type which can either be a common aggregate operator OR a
 * constant value itself.
 */
declare type ValueOrAggregateOperator<T> = {
    $any?: T[];
    $all?: T[];
} | T;
/**
 * Attributes that are common to all field types in the validation schema.
 */
export declare type ValidationSchemaFieldCommon<T> = {
    /**
     * Tests either the specified value, or each of the specified values in the case
     * of an array being provided, passing validation if the value matches any of the
     * specified values using JavaScript's equality operator.
     */
    equals?: T | T[];
    /**
     * Tests the value against the regular expression(s). Validation is passed if the
     * regular expression has one or more match, if all the regular expressions have a match ($all)
     * or if any of the regular expressions have a match ($any).
     */
    matches?: ValueOrAggregateOperator<RegExp>;
    /**
     * Whether or not the value must explicitly be present to pass validation.
     * Possible values:
     * - false: (default) value does not need to be present to pass validation.
     * - true: value must be explicitly specified to pass validation and may not be null.
     * - explicit: value must be present (i.e., not undefined) but may be null or nullish to pass validation.
     */
    required?: false | true | 'explicit';
    /**
     * The human-readable name of the field to be substituted into the invalidMessage.
     * If you set an invalidMessage that does not use the fieldName placeholder (${fieldName}),
     * this will be ignored.
     */
    fieldName?: string;
    /**
     * The message that should be displayed if validation fails.
     * This can either be a string which will be used regardless of the failure reason, or - where
     * applicable - this can be an object which allows setting individual 'invalidMessage's based
     * on the reason.
     */
    invalidMessage?: string;
} & ValidationSchemaFieldCommonOperators;
/**
 * Operators that can be applied to all field types in the schema.
 */
export declare type ValidationSchemaFieldCommonOperators = {
    /**
     * If set, the value must be equal to the value of the specified property to pass validation.
     */
    $eq?: string;
};
export {};
