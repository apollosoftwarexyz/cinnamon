import ValidationResult from "./result";
import { ValidationSchema } from "./validation-schema/core";
/**
 * A Validator handles performing validation on objects according to the specified schema provided to it when it was
 * initialized.
 */
export declare class Validator {
    readonly schema: ValidationSchema;
    /**
     * Whether or not the schema on this executor is for a single field (i.e.. a
     * validation schema field) (= true) or for an entire object (i.e., a
     * validation schema object) (= false).
     */
    private readonly isSingleFieldSchema;
    /**
     * Initializes a ValidationSchemaExecutor with the specified schema. Once initialized, the
     * schema may not be changed (you should use a new ValidationSchemaExecutor for a new schema).
     *
     * @param schema The schema the ValidationSchemaExecutor should perform validation with.
     */
    constructor(schema: ValidationSchema);
    /**
     * Performs validation on the specified value according to the executor's specified schema.
     * If validation passes, this method returns true, otherwise it returns false.
     *
     * @param value The value to check (perform validation) against the schema.
     * @return result An array, with the first index (0) being the validation result, and the
     * second (1) being either the inputted value if it was valid, or undefined if it wasn't.
     */
    validate(value: any): [ValidationResult, any | undefined];
    private validateSchemaAgainstObject;
    private validateSchemaAgainstField;
    private _evaluateAttributeValues;
    private _fail;
    private _badFieldMessage;
    private _toHumanReadableFieldName;
    /**
     * Checks if the specified object is a validation schema object (true) or
     * a single validation schema field (false).
     * @param  value               The object to check.
     * @return {boolean} isValidationSchemaObject - true the specified value is
     * a validation schema object, false if it's just a validation schema field.
     */
    private static _isValidationSchemaObject;
}
