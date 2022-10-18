/// Validation Schema Common definitions
/// ---
/// This file defines attributes which are common to all field types, as
/// well as the operators common to all field types.

/**
 * @see ValidationFailureMessage
 */
export type ValidationFailureMessageFn = ((value: any, options?: { vague?: boolean }) => string);

/**
 * Either a string which will be used for all validation failures, or a function that takes a value
 * (and options) which is expected to return a message to be used.
 */
export type ValidationFailureMessage = ValidationFailureMessageFn | string;

/**
 * Defines a type which can either be a common aggregate operator OR a
 * constant value itself.
 */
export type ValueOrAggregateOperator<T> = {
    $any: T[];
} | {
    $all: T[];
} | T;

/**
 * Message attributes that are common to all field types.
 */
export type ValidationSchemaFieldCommonMessage = {
    /**
     * The human-readable name of the field to be substituted into the invalidMessage.
     * If you set an invalidMessage that does not use the fieldName placeholder (${fieldName}),
     * this will be ignored.
     */
    fieldName?: string;

    /**
     * A function that defines the message that should be displayed if validation fails.
     *
     * This can either be a string which will be used regardless of the failure reason, or a function
     * that takes the value, and an optional second parameter for whether error messages should be
     * vague. (See {@link ValidationFailureMessage}).
     */
    invalidMessage?: ValidationFailureMessage;
}

/**
 * Attributes that are common to all field types in the validation schema.
 */
export type ValidationSchemaFieldCommon<T> = ({

    /**
     * Tests either the specified value, or each of the specified values in the case
     * of an array being provided, passing validation if the value matches any of the
     * specified values using JavaScript's type-equal equality operator (===).
     *
     * (!!!) If you want to check if the value is equal to one array, or one in
     * a set of nested arrays, use arrayEquals instead.
     */
    equals?: T | T[];

    arrayEquals?: never;

} | {

    equals?: never;

    /**
     * Tests either the specified value (which should be an array), or each of
     * the specified values in the case of an array of arrays being provided,
     * passing validation if the value matches any of the specified values.
     *
     * Instead of using JavaScript's type-equal equality operator (===), the
     * array elements are compared with each other, meaning the array's needn't
     * be sorted (as JSON has no set representation). If your intention is that
     * the array should be equal *in order*, string equality should be checked
     * instead.
     *
     * This is essentially a version of equals that enables checking equality
     * with an array or one in a set of nested arrays. In other words, you'd use
     * this check if the value you're checking would be an array.
     */
    arrayEquals?: T | T[];

}) & {
    /**
     * Tests the value against the regular expression(s). Validation is passed if the
     * regular expression has one or more match, if all the regular expressions have a match ($all)
     * or if any of the regular expressions have a match ($any).
     */
    matches?: ValueOrAggregateOperator<RegExp>;

    /**
     * Tests the value with the specified custom validator. If a boolean is
     * returned then true is considered validation success and false is
     * considered validation failure.
     *
     * Conversely, if a string is used, the presence of a string is considered
     * validation failure and the value of the string is used as the error
     * message.
     *
     * If null is returned, it is considered validation success.
     * @param value The value to validate.
     * @param object The overall object being validated.
     */
    validator?: (value: any, object: any) => Promise<boolean | string | null>;

    /**
     * Whether the value must explicitly be present to pass validation.
     * Possible values:
     * - false: (default) value does not need to be present to pass validation.
     * - true: value must be explicitly specified to pass validation and may not be null.
     * - explicit: value must be present (i.e., defined) but may be null or nullish to pass validation.
     */
    required?: false | true | 'explicit';
} & ValidationSchemaFieldCommonOperators & ValidationSchemaFieldCommonMessage;

/**
 * Operators that can be applied to all field types in the schema.
 */
export type ValidationSchemaFieldCommonOperators = {
    /**
     * If set, the value must be equal to the value of the specified property to pass validation.
     */
    $eq?: string;
}
