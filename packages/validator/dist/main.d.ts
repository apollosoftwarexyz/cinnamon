import { ValidationSchema } from './validation-schema/core';
import { ValidationSchemaExecutor } from "./executor";
/**
 * An alias to create a Validation Schema Executor from the specified schema.
 * (Put simply, a Validation Schema Executor handles performing validation on objects according to the specified
 * schema.)
 *
 * @param schema The schema to perform validation of values against.
 */
declare function createValidationSchemaExecutor(schema: ValidationSchema): ValidationSchemaExecutor;
export { createValidationSchemaExecutor, createValidationSchemaExecutor as $, ValidationSchemaExecutor };
