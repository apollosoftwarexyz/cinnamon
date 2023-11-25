// / Core Validation Schema definitions.
// / ---
// / This file defines a top-level validation object and defines all the
// / possible validation 'field' types that can be mapped to string keys
// / (or recursively to other validation objects which act as sub-schemas)
// / within that object.
// / The entire extended validation object contained within the top-level
// / validation object is collectively known as a 'validation schema'.

import { ValidationSchemaCommon, ValidationSchemaFieldCommon, ValidationSchemaFieldCommonMessage } from './common';
import { ValidationSchemaFieldSmartAttribute } from './attribute';

/**
 * Defines the validation schema field type 'any', which matches
 * any type.
 */
export type ValidationSchemaFieldTypeAny = {
    type: 'any'
} & ValidationSchemaFieldCommon<any>;

/**
 * Defines the validation schema field types for primitive types
 * (i.e., types built into TypeScript.)
 */
export type ValidationSchemaFieldTypePrimitive = ValidationSchemaFieldCommon<string> & {
    type: 'string',

    /**
     * Whether the strings should be coalesced (stringified) before validation.
     * Some implementations may not care if the value is actually a string, or
     * not (e.g., a number or boolean value may be valid as a string once
     * stringified) but others may care (e.g., a number or boolean value should
     * not be considered valid as a string).
     *
     * When this is set to true, the value will be stringified before
     * validation. Otherwise, it will be validated as-is.
     *
     * **We anticipate that most implementations will want to set this to
     * true as the purpose of validating as a string would imply that a
     * permitted value should strictly be a string.**
     *
     * This is essentially the difference between <code>==</code> and
     * <code>===</code> in JavaScript.
     */
    strict?: boolean,

    /**
     * The minimum length of the string. Must be greater than or equal to zero.
     */
    minLength?: ValidationSchemaFieldSmartAttribute<number>,

    /**
     * The maximum length of the string. There's not explicit maximum but
     * JavaScript struggles with large numbers.
     * Must be greater than or equal to zero.
     */
    maxLength?: ValidationSchemaFieldSmartAttribute<number>,
} | ValidationSchemaFieldCommon<boolean> & {
    type: 'boolean'
} | ValidationSchemaFieldCommon<number> & {
    type: 'number',

    /**
     * The minimum value of the number value. The number value must be greater than
     * or equal to this value.
     */
    min?: ValidationSchemaFieldSmartAttribute<number>,

    /**
     * The maximum value of the number value. The number value must be less than or
     * equal to this value.
     */
    max?: ValidationSchemaFieldSmartAttribute<number>,

    /**
     * Whether the number must be a whole integer to pass validation.
     */
    integer?: boolean,

    /**
     * Similarly to the 'strict' attribute for strings, this attribute
     * determines whether values that *can* be interpreted/coerced as a number
     * should be considered valid.
     *
     * For example, the string '1' can be interpreted as the number 1. If this
     * attribute is set to true, then the string '1' will not be considered a
     * valid number. Otherwise, it will be considered a valid number.
     *
     * **We anticipate that most implementations will want to set this to
     * true as the purpose of validating as a number would imply that a
     * permitted value should strictly be a number.**
     */
    strict?: boolean,
};

export type ValidationSchemaNestable = ValidationSchemaField | ValidationSchemaArray | ValidationSchemaObject;

/**
 * Defines the validation schema field types for custom fields.
 */
export type ValidationSchemaFieldTypeCustom = {
    type: 'OneOf',
    possibleSchemas: ValidationSchemaNestable[]
} & ValidationSchemaFieldCommonMessage
    & ValidationSchemaCommon;

/**
 * Defines all the possible validation schema field types.
 */
export type ValidationSchemaField =
    | ValidationSchemaFieldTypeAny
    | ValidationSchemaFieldTypePrimitive
    | ValidationSchemaFieldTypeCustom;

/**
 * Defines a 'ValidationSchemaArray', which is an array of ValidationSchemaField (or nested
 * sub-schema) entries.
 */
export type ValidationSchemaArray = [ValidationSchemaNestable] | [];

/**
 * Recursively defines a 'ValidationSchemaObject', which is a dictionary of string key to
 * ValidationSchemaField (or nested sub-schema) entries.
 */
export interface ValidationSchemaObject {
    [key: string]: ValidationSchemaNestable;
}

/**
 * Defines a top-level ValidationSchema object, which is either an individual field or a
 * top-level ValidationSchemaObject.
 */
export type ValidationSchema = ValidationSchemaNestable;
