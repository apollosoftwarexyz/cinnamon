import { ValidationSchema } from './validation-schema/core';
import { Validator } from "./executor";
/**
 * An alias to create a validator from the specified schema.
 * (Put simply, a validator handles performing validation on objects according to the specified validation schema.)
 *
 * This method is also exported as '$' to allow for convenient access to the validator.
 *
 * @param schema The schema to perform validation of values against.
 */
declare function createValidator(schema: ValidationSchema): Validator;
export { ValidationSchema, createValidator, createValidator as $, Validator };
import ValidationResult from './result';
export { ValidationResult };
