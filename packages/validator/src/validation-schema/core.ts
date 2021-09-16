/// Core Validation Schema definitions.
/// ---
/// This file defines a top-level validation object and defines all the
/// possible validation 'field' types that can be mapped to string keys
/// (or recursively to other validation objects which act as sub-schemas)
/// within that object.
/// The entire extended validation object contained within the top-level
/// validation object is collectively known as a 'validation schema'.

import { ValidationSchemaFieldCommon, ValidationSchemaFieldCommonMessage } from "./common";
import { ValidationSchemaFieldSmartAttribute } from './attribute';

/**
 * Defines the validation schema field type 'any', which matches
 * any type.
 */
export type ValidationSchemaFieldTypeAny = {
    type: "any"
} & ValidationSchemaFieldCommon<any>;

/**
 * Defines the validation schema field types for primitive types
 * (i.e., types built into TypeScript.)
 */
export type ValidationSchemaFieldTypePrimitive = ValidationSchemaFieldCommon<string> & {
    type: "string",
    /**
     * The minimum length of the string. Must be greater than or equal to zero.
     */
    minLength?: ValidationSchemaFieldSmartAttribute<number>,
    /**
     * The maximum length of the string. There's not explicit maximum but JavaScript
     * struggles with large numbers. Must be greater than or equal to zero.
     */
    maxLength?: ValidationSchemaFieldSmartAttribute<number>,
} | ValidationSchemaFieldCommon<boolean> & {
    type: "boolean"
} | ValidationSchemaFieldCommon<number> & {
    type: "number",
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
};

/**
 * Defines the validation schema field types for custom fields.
 */
export type ValidationSchemaFieldTypeCustom = {
    type: "OneOf",
    possibleSchemas: ValidationSchemaField[]
} & ValidationSchemaFieldCommonMessage;

/**
 * Defines all the possible validation schema field types.
 */
export type ValidationSchemaField =
    | ValidationSchemaFieldTypeAny
    | ValidationSchemaFieldTypePrimitive
    | ValidationSchemaFieldTypeCustom;

/**
 * Recursively defines a 'ValidationSchemaObject', which is a dictionary of string key to
 * ValidationSchemaField (or nested sub-schema) entries.
 */
export interface ValidationSchemaObject {
    [key: string]: ValidationSchemaField | ValidationSchemaObject;
}

/**
 * Defines a top-level ValidationSchema object, which is either an individual field or a
 * top-level ValidationSchemaObject.
 */
export type ValidationSchema = ValidationSchemaField | ValidationSchemaObject;
