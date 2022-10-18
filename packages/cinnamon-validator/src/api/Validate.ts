type TypedValidateOptions<T> =
    T extends string ? { minLength?: number; maxLength?: number; } :
    T extends number ? { min?: number; max?: number; } :
    {};

type ValidateOptions<T> = TypedValidateOptions<T> &
    {
        /**
         * Whether the field must be set.
         */
        required?: boolean;

        /**
         * Whether null values (or nullish values such as undefined or empty string) are permitted for the field.
         * The default is true, unless {@see required} is set.
         */
        nullable?: boolean;
    }

/**
 * Applies the specified validation rules to the decorated value.
 *
 * @param rules A rule or set of rules to apply.
 * @param message The message to be displayed if validation fails. Can be a function or a string (where the string is
 * used for all specified rules).
 * @param options Additional options that may be set for the validation rule.
 */
export default function Validate<T>(rules: ValidateOptions<T>, message?: string | ((value: T) => string), options?: {
    /**
     * Whether the error message should have the field name (or human-readable
     * field name, see {@link name}) prepended to it.
     * Default is true.
     */
    prefixErrorMessage?: boolean;
}) {
    return function <U extends object, K extends keyof U>(
        target: U,
        propertyKey: U[K] extends T ? K : never
    ) {
        if (!propertyKey) return;


        // TODO
    }
}
