/**
 * A collection of popular regular expressions.
 *
 * You can access and use these directly, or you can use the {@link Matcher} class
 * for better readability.
 *
 * @see Matcher
 */
export const CommonRegExp = {

    /**
     * Matches against an RFC2822 email address.
     */
    email: /^(?:[a-z\d!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z\d!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z\d](?:[a-z\d-]*[a-z\d])?|\[(?:(2(5[0-5]|[0-4]\d)|1\d\d|[1-9]?\d)\.){3}(?:(2(5[0-5]|[0-4]\d)|1\d\d|[1-9]?\d)|[a-z\d-]*[a-z\d]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])$/,

    /**
     * Matches against any version of UUID.
     */
    UUID: /^[\dA-F]{8}\b-[\dA-F]{4}\b-[\dA-F]{4}\b-[\dA-F]{4}\b-[\dA-F]{12}$/i,

    /**
     * Matches against a UUIDv4 (the most commonly used UUID - based on randomness).
     */
    UUIDv4: /^[\dA-F]{8}\b-[\dA-F]{4}\b-4[\dA-F]{3}\b-[89AB][\dA-F]{3}\b-[\dA-F]{12}$/i,

    /**
     * Matches common requirements for a username (a word consisting of letters that are universally
     * easy to type and with no spaces).
     */
    username: /^[\w.]{2,30}$/,

    /**
     * Matches common (basic) requirements for a password (a lowercase letter, an uppercase letter
     * and a number) and at least 8 characters in length.
     */
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,255}$/

};

// TODO: evaluate use of function here.
/**
 * A set of default messages for each RegExp in {@link CommonRegExp} for when validation fails.
 *
 * Each message is expressed as a function that takes the value to allow the message to be dynamically
 * set based on the value. Additionally, a second parameter (vague) may be set to keep the messages
 * vague regardless of the reason validation failed.
 */
export const CommonRegExpMessages : {
    [Property in keyof typeof CommonRegExp]: string | ((value: any, options?: { vague?: boolean }) => string);
} = {
    email: 'is not a valid e-mail address',
    UUID: 'is not a valid ID',
    UUIDv4: 'is not a valid ID',
    username: (value, options) => {
        if (options?.vague) return 'is not a valid username';

        if (value.length < 2)
            return 'is too short (must be at least 2 characters)';

        if (value.length > 30)
            return 'is too long (must be at most 30 characters)';

        else return 'is not a valid username (may contain only letters, numbers, periods or underscores)';
    },
    password: (value, options) => {
        if (options?.vague) return 'is not a valid password';

        if (value.length < 8)
            return 'is too short (must be at least 8 characters)';

        if (value.length > 255)
            return 'is too long (must be at most 255 characters)';

        else return 'is not a complex enough password (must contain at least one lowercase letter, one uppercase letter and one number)';
    }
};

/**
 * Represents a function that will match the specified value against a regular expression
 * (or perform a match in a similar manner) and which returns true for a positive match or
 * false for a negative match.
 *
 * A {@link SimpleMatcherFunction} is one that takes no other parameters than the value to
 * check. (As opposed to some advanced matcher function - for example, a credit card number
 * matching function that might also take a parameter for the card processor to perform
 * more specific validation).
 */
export type SimpleMatcherFunction = (value: any) => boolean;

/**
 * Represents a function that will assert the value.
 * This means it returns nothing if the value is correct but will return an error message if
 * the value is incorrect.
 *
 * A {@link SimpleAssertionFunction} is usually an assertion for a {@link SimpleMatcherFunction}.
 */
export type SimpleAssertionFunction = (value: any, options?: { vagueErrors?: boolean }) => string | null;

/**
 * Defines the list of matcher functions based on {@link CommonRegExp}.
 */
type AutoMatcherFunctions = {
    [Property in keyof typeof CommonRegExp as `is${Capitalize<Property>}`]: SimpleMatcherFunction
} & {
    [Property in keyof typeof CommonRegExp as `assert${Capitalize<Property>}`]: SimpleAssertionFunction
}

/**
 * The superclass for the {@link Matcher} that automatically injects matcher
 * functions for each of the {@link CommonRegExp}s.
 */
function defineAutoMatcher() : { new (): AutoMatcherFunctions } {
    const autoMatcher = class {} as any;

    // Inject the AutoMatcher and AutoAssert methods for each CommonRegExp.
    for (const regExpName of Object.keys(CommonRegExp)) {
        // Prepend 'is' and capitalize first letter. (e.g., 'email' -> 'isEmail')
        const matcherFnName = `is${regExpName.charAt(0).toUpperCase()}${regExpName.slice(1)}`;
        // Prepend 'assert' and capitalize first letter. (e.g., 'email' -> 'assertEmail')
        const assertFnName = `assert${regExpName.charAt(0).toUpperCase()}${regExpName.slice(1)}`;

        // Then, assign an automatic matcher function based on testing the entry in CommonRegExp.
        const matcherFn = (value: any) => (
            CommonRegExp[regExpName as keyof typeof CommonRegExp] as RegExp
        ).test(value);
        autoMatcher.prototype[matcherFnName] = matcherFn;

        // ...and an automatic assertion function.
        autoMatcher.prototype[assertFnName] = (value: any, options?: { vagueErrors?: boolean }) => matcherFn(value)
            // Return null if the value matches
            ? null
            // Otherwise, return an error message (evaluating the error message value as a function if it
            // is not a string).
            : (typeof CommonRegExpMessages[regExpName] === 'string'
                ? CommonRegExpMessages[regExpName]
                : CommonRegExpMessages[regExpName](value, { vague: options?.vagueErrors }));
    }

    return autoMatcher;
}

/**
 * Matches values against the {@link CommonRegExp} set of common regular expressions.
 */
class MatcherImpl extends defineAutoMatcher() {}

/**
 * A utility class that handles matching or validating strings (typically against regular
 * expressions).
 *
 * @see CommonRegExp
 */
export const Matcher = new MatcherImpl();
