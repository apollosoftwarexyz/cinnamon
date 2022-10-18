/**
 * Represents a dictionary of validation failure messages.
 * The key is intended to denote the field where the validation error occurred and the
 * value is the validation failure message that should be displayed for that field.
 */
type ValidationResultFailMessages = {
    [key: string]: string | ValidationResultFailMessages
};

interface IValidationResultSuccess<T>  { success: true; value: T;  }
interface IValidationResultFail        { success: false; messages: ValidationResultFailMessages; }

/**
 * Represents a successfully validated object.
 * The response object, {@link value} is typed accordingly with the validation
 * schema.
 */
export class ValidationResultSuccess<T> implements IValidationResultSuccess<T> {

    success: true;

    /**
     * The successfully validated object (typed accordingly with the schema).
     * Ordinarily, the values in this object would be as they were passed in.
     */
    public readonly value: T;

    constructor(value: T) {
        this.value = value;
    }

}

/**
 * Represents an object that failed validation.
 * The {@link messages} dictionary contains per-field failure messages.
 */
export class ValidationResultFail implements IValidationResultFail {

    success: false;

    /**
     * The error message dictionary for all specified fields.
     */
    public readonly messages: ValidationResultFailMessages;

    constructor(messages: ValidationResultFailMessages) {
        this.messages = messages;
    }

}

/**
 * The base type for a result from the validation library.
 * It would be unusual for this base type to be used directly (except where
 * checking if the result of a validation was successful or a failure).
 *
 * Instead, you would be expected to interact with {@link ValidationResultSuccess}
 * or {@link ValidationResultFail} depending on the validation status as these
 * will contain specific information about the validated object (be it error
 * messages or the typed response object.)
 *
 * @see ValidationResultSuccess
 * @see ValidationResultFail
 */
export type IValidationResult<T> =
    | IValidationResultSuccess<T>
    | IValidationResultFail;

/**
 * A helper class that introduces static syntactic sugars for successful or
 * failed validation responses.
 */
export default class ValidationResult {

    /**
     * Alias for creating a {@link ValidationResultSuccess} object for a payload
     * that passed validation.
     * @param value The typed, successfully validated, object.
     */
    static success<T>(value: T) : ValidationResultSuccess<T> {
        return new ValidationResultSuccess<T>(value);
    }

    /**
      * Alias for creating a {@link ValidationResultFail} object for a payload that
      * failed validation.
      * @param messages The per-field error messages. The field is the key and the
      * value for a given key is the message corresponding to that field.
      */
    static fail(messages: ValidationResultFailMessages) {
        return new ValidationResultFail(messages);
    }

}

