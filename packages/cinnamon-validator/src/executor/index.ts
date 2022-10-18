// type ValidatorFieldTypes =
//     | 'any'
//     | 'string'
//     | 'number'
//     | 'boolean'
//     | 'array'
//     | 'object';

type ValidatorAssertion = (value: any, object: any) => Promise<string>;

/**
 * Compiles the specified schema to create a validator.
 * The schema should be the class prototype rather than an instance for better
 * efficiency - as the use of the schema is immutable and calling
 * {@link ValidatorExecutor.validate} creates a new object.
 *
 * @param schema The schema to create the validator with.
 */
export function createValidator<T>(schema: T) : ValidatorExecutor<T> {
    // TODO: compile schema and initialize executor.

    throw new Error('Not yet implemented');
    //return new ValidatorExecutor<T>();
}

/** Denotes properties common to a validator field. */
interface IValidatorField {
    /**
     * The field type.
     */
    type: string;

    /**
     * The name of this field.
     */
    name: string;

    /**
     * The path to the field - up to the root node.
     */
    path: string;

    /**
     * If set, the children of the current field.
     * (Only valid for object fields).
     */
    children?: IValidatorField[];

    /**
     * The set of assertions that must pass for this field to be considered
     * valid.
     */
    rules?: ValidatorAssertion;
}

export class ValidatorExecutor<T> {

    /**
     * The schema. This is defined in terms of the root field which contains
     * its children.
     * @private
     */
    private schema: IValidatorField;

    constructor(schema: IValidatorField) {
        this.schema = schema;
    }

    /**
     * Performs validation on the specified value.
     * @param value The object to validate against this validator's schema.
     */
    public validate<U = Omit<Pick<T, keyof T>, 'compile'>>(value: any) : U {
        // Initialize value if it is not a valid object - this allows us to simply use the default error.
        if (!value || typeof value !== 'object') value = {};

        // TODO: implement validate.
        // return {} as U;
        throw new Error('Not yet implemented');
    }

}
