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
export type ValidationSchemaFieldTypeAny =
    (ValidationSchemaFieldCommon<any> & {
        type: "any"
    });

/**
 * Defines the validation schema field types for primitive types
 * (i.e., types built into TypeScript.)
 */
export type ValidationSchemaFieldTypePrimitive =
    // String type
    (ValidationSchemaFieldCommon<string> & {
        type: "string",
        /**
         * The minimum length of the string. Must be greater than or equal to zero.
         */
        minLength?: ValidationSchemaFieldSmartAttribute<number>,
        /**
         * The maximum length of the string. There's no explicit maximum but JavaScript
         * struggles with large numbers. Must be greater than or equal to zero.
         */
        maxLength?: ValidationSchemaFieldSmartAttribute<number>,
    }) |

    // Boolean type
    (ValidationSchemaFieldCommon<boolean> & {
        type: "boolean"
    }) |

    // Number type
    (ValidationSchemaFieldCommon<number> & {
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
    });

/**
 * Defines advanced validation schema field types.
 */
export type ValidationSchemaFieldTypeAdvanced =
    // OneOf type (matches one of multiple schemas)
    (ValidationSchemaFieldCommonMessage & {
        type: "oneOf",
        possibleSchemas: ValidationSchemaField[]
    });

/**
 * Defines all the possible validation schema field types.
 */
export type ValidationSchemaField =
    | ValidationSchemaFieldTypeAny
    | ValidationSchemaFieldTypePrimitive
    | ValidationSchemaFieldTypeAdvanced

/**
 * Recursively defines a 'ValidationSchemaObject', which is a dictionary of string key to
 * ValidationSchemaField (or nested sub-schema) entries.
 */
export interface IValidationSchemaObject {
    [key: string]: ValidationSchemaObject | ValidationSchemaField;
}
type ValidationSchemaObject = Omit<IValidationSchemaObject, 'type'>;

/**
 * Defines a top-level ValidationSchema object, which is either an individual field or a
 * top-level ValidationSchemaObject.
 */
export type ValidationSchema = ValidationSchemaObject | ValidationSchemaField;

/**
 * Checks whether the specified schema defines a schema within itself.
 * @param schema
 */
export function hasSubSchema(schema: ValidationSchema) : boolean {

    if (Object.hasOwn(schema, 'type')) return false;

}
