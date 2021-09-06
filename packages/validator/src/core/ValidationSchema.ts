type ValidationSchemaFieldAggregate<T> = {
    $any?: T[];
    $all?: T[];
} | T;

type ValidationSchemaFieldOperators = {
    /**
     * If set, the value must be equal to the value of the specified property to pass validation.
     */
    $eq?: string
}

type ValidationSchemaFieldCommon<T> = {
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
    matches?: ValidationSchemaFieldAggregate<RegExp>;

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
} & ValidationSchemaFieldOperators;

type ValidationSchemaField =
    | {
        type: "any"
    } & ValidationSchemaFieldCommon<any>
    | {
        type: "string",
        /**
         * The minimum length of the string. Must be greater than or equal to zero.
         */
        minLength?: number,
        /**
         * The maximum length of the string. There's not explicit maximum but JavaScript
         * struggles with large numbers. Must be greater than or equal to zero.
         */
        maxLength?: number,
    } & ValidationSchemaFieldCommon<string>
    | {
        type: "boolean",
    } & ValidationSchemaFieldCommon<boolean>
    | {
        type: "number",
        /**
         * The minimum value of the number value. The number value must be greater than
         * or equal to this value.
         */
        min?: number,
        /**
         * The maximum value of the number value. The number value must be less than or
         * equal to this value.
         */
        max?: number,
        /**
         * Whether the number must be a whole integer to pass validation.
         */
        integer?: boolean,
    } & ValidationSchemaFieldCommon<number>;

export interface ValidationSchemaObject {
    [key: string]: ValidationSchemaField;
}
