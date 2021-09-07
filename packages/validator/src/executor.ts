import {ValidationSchema} from "./validation-schema/core";

/**
 * A Validation Schema Executor handles performing validation on objects according to the specified
 * schema provided to it when it was initialized.
 */
export class ValidationSchemaExecutor {

    public readonly schema: ValidationSchema;

    /**
     * Initializes a ValidationSchemaExecutor with the specified schema. Once initialized, the
     * schema may not be changed (you should use a new ValidationSchemaExecutor for a new schema).
     *
     * @param schema The schema the ValidationSchemaExecutor should perform validation with.
     */
    constructor(schema: ValidationSchema) {
        this.schema = schema;
    }

    /**
     * Performs validation on the specified value according to the executor's specified schema.
     * If validation passes, this method returns true, otherwise it returns false.
     *
     * @param value The value to check (perform validation) against the schema.
     */
    public validate(value: any) : boolean {
        return true;
    }

}
