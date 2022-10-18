/// Validation Schema Attribute definitions
/// ---
/// This file defines additional attribute types which may be applied to
/// validation attributes contained within a Validation Schema Field.

type ValidationSchemaFieldSmartAttributeOperatorEval<T> = (currentObject: any) => T;

/**
 * A smart attribute can be equal to a direct constant value, or it can be derived from an operator,
 * such as $eq (equal to reference) or $eval (result of function), etc.
 */
export type ValidationSchemaFieldSmartAttribute<T> = {
    /**
     * Sets the value of this schema field attribute equal to the reference.
     */
    $eq?: string;
} | {
    /**
     * Evaluates the function, sets the value of this schema field attribute equal to the result of the function.
     */
    $eval?: ValidationSchemaFieldSmartAttributeOperatorEval<T>;
} | T;
