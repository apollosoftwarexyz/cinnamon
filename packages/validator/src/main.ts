import { ValidationSchemaObject } from './core/ValidationSchema';

class ValidationSchemaExecutor {

    public readonly schema: ValidationSchemaObject;

    constructor(schema: ValidationSchemaObject) {
        this.schema = schema;
    }

}

/**
 * Creates a Validation Schema Executor from the specified schema.
 * (Put simply, a Validation Schema Executor handles performing validation on objects according to the specified
 * schema.)
 *
 * @param schema The schema to perform validation of values against.
 */
export default function ValidationSchema(schema: ValidationSchemaObject) : ValidationSchemaExecutor {
    return new ValidationSchemaExecutor(schema);
}

// Aliased imports
export { ValidationSchema as $ };
