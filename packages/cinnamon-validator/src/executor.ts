import ValidationResult from './result';
import { ValidationSchemaFieldSmartAttribute } from './validation-schema/attribute';
import {
    ValidationSchema,
    ValidationSchemaArray,
    ValidationSchemaField,
    ValidationSchemaNestable,
    ValidationSchemaObject
} from './validation-schema/core';
import { arrayEquals, resolveObjectDeep } from '@apollosoftwarexyz/cinnamon-internals';

type _ExecutorValidationFailOptions = {
    field: ValidationSchemaField,
    fieldName?: string,
    parentName?: string,
    defaultMessage?: string
};

type _ValidationSchemaFieldSmartAttributeObject = {
    [key: string]: ValidationSchemaFieldSmartAttribute<any>;
};

enum _ValidationSchemaType {
    Object = 'object',
    Array = 'array',
    Field = 'field'
}

enum _FieldTypesSupportedByExecutor {
    Any = 'any',
    String = 'string',
    Boolean = 'boolean',
    Number = 'number',
    OneOf = 'OneOf'
}

export interface ValidatorOptions {

    /**
     * Similarly to strings and numbers, arrays can be forcibly coerced into
     * an array from a stringified JSON array. If this option is set to true,
     * the validator will **not** attempt to coerce a stringified JSON array
     * into an array.
     *
     * Otherwise, if a valid JSON array is detected in a string, it will be
     * parsed and validated as an array when the schema calls for an array.
     *
     * **This defaults to false, unlike the other strict options.** This is
     * because it's more likely that a user/client will accidentally submit a
     * stringified array (e.g., in a form or query) than a stringified object
     * or number.
     *
     * In other words, **by default** the validator will attempt to coerce a
     * stringified JSON array into an array.
     */
    strictArrays?: boolean;

}

/**
 * A Validator handles performing validation on objects according to the specified schema provided to it when it was
 * initialized.
 */
export class Validator {

    public readonly schema: ValidationSchema;

    public readonly options: ValidatorOptions;

    /**
     * Whether the schema on this executor is for a single field (i.e., a
     * validation schema field) (= _ValidationSchemaType.Field), for an
     * entire object (i.e., a validation schema object)
     * (= _ValidationSchemaType.Object), or for an array (i.e., a validation
     * schema array) (= _ValidationSchemaType.Array).
     */
    private readonly schemaType: _ValidationSchemaType;

    /**
     * Initializes a ValidationSchemaExecutor with the specified schema. Once initialized, the
     * schema may not be changed (you should use a new ValidationSchemaExecutor for a new schema).
     *
     * @param schema The schema the ValidationSchemaExecutor should perform validation with.
     * @param options Additional options for the executor.
     */
    constructor(schema: ValidationSchema, options?: ValidatorOptions) {
        Validator._checkSchema(schema);

        this.schema = schema;

        this.options = Object.assign({
            strictArrays: false
        }, options);

        if (Validator._isValidationSchemaObject(this.schema)) {
            this.schemaType = _ValidationSchemaType.Object;
        } else if (Validator._isValidationSchemaArray(this.schema)) {
            this.schemaType = _ValidationSchemaType.Array;
        } else {
            this.schemaType = _ValidationSchemaType.Field;
        }
    }

    /**
     * Performs validation on the specified value according to the executor's specified schema.
     * If validation passes, this method returns true, otherwise it returns false.
     *
     * @param value The value to check (perform validation) against the schema.
     * @return result An array, with the first index (0) being the validation result, and the
     * second (1) being either the inputted value if it was valid, or undefined if it wasn't.
     */
    public validate(value: any) : [ ValidationResult, any | undefined ] {
        let result: ValidationResult;

        switch (this.schemaType) {
            case _ValidationSchemaType.Object:
                result = this.validateSchemaAgainstObject(
                    this.schema as ValidationSchemaObject,
                    value,
                    value,
                    '$root',
                    undefined
                );
                break;
            case _ValidationSchemaType.Array:
                result = this.validateSchemaAgainstArray(
                    this.schema as ValidationSchemaArray,
                    value,
                    undefined,
                    '$root',
                    undefined
                );
                break;
            case _ValidationSchemaType.Field:
                result = this.validateSchemaAgainstField(
                    this.schema as ValidationSchemaField,
                    value,
                    undefined,
                    '$root',
                    undefined
                );
                break;
        }

        return [ result, result.success ? value : undefined ];
    }

    private validateSchemaAgainstObject(object: ValidationSchemaObject, value: any, _entireObject?: any, _fieldName?: string, _parentName?: string) : ValidationResult {

        // If the object is not required and the value is undefined or null,
        // short-circuit with a success.
        if (!Validator._isRequired(object) && (value === undefined || value === null)) {
            return ValidationResult.success();
        }

        // We're attempting to validate against an object, so if the value in question is not
        // an object, clearly it does not meet validation.
        if (typeof value !== 'object') {
            // If we're evaluating the root object against an object schema,
            // but the value is not an object, we know the object is missing
            // and thus the payload is invalid.
            if (_parentName === undefined && _fieldName === '$root') {
                return ValidationResult.fail('The submitted value is invalid.');
            }

            let objectName = Validator._toHumanReadableFieldName(`${_parentName}.${_fieldName}`);
            return ValidationResult.fail(`The '${objectName}' field is missing or invalid.`);
        }

        // Loop over every key in the current object.
        for (let key of Object.keys(object)) {
            // If the entry at key in the schema is a validation schema object,
            // then validate against the object (recursively if necessary.)
            if (Validator._isValidationSchemaObject(object[key])) {

                // Immediately fail validation if a child schema fails
                // validation.
                const childSchemaValidation = this.validateSchemaAgainstObject(
                    object[key] as ValidationSchemaObject,
                    value !== undefined && value !== null ? value[key] : undefined,
                    _entireObject,
                    key,
                    `${_parentName !== undefined ? _parentName + '.' : ''}${_fieldName}`
                );
                if (!childSchemaValidation.success) return childSchemaValidation;

            // Otherwise, if the current entry is a validation schema array,
            // then validate against the array.
            } else if (Validator._isValidationSchemaArray(object[key])) {

                const childSchemaValidation = this.validateSchemaAgainstArray(
                    object[key] as ValidationSchemaArray,
                    value !== undefined && value !== null ? value[key] : undefined,
                    _entireObject,
                    key,
                    `${_parentName !== undefined ? _parentName + '.' : ''}${_fieldName}`
                );
                if (!childSchemaValidation.success) return childSchemaValidation;

            // Otherwise, if the current entry is a field, attempt to validate
            // that sole field, again, immediately failing validation if that
            // field fails validation.
            } else {

                const childFieldValidation = this.validateSchemaAgainstField(
                    object[key] as ValidationSchemaField,
                    value !== undefined && value !== null ? value[key] : undefined,
                    _entireObject,
                    key,
                    `${_parentName !== undefined ? _parentName + '.' : ''}${_fieldName}`
                );
                if (!childFieldValidation.success) return childFieldValidation;

            }
        }

        // If all the above checks have completed without 'short-circuiting',
        // then we may reasonably conclude validation must have passed.
        return ValidationResult.success();

    }

    private validateSchemaAgainstArray(array: ValidationSchemaArray, value: any, _entireObject?: any, _fieldName?: string, _parentName?: string) : ValidationResult {
        let arrayName = Validator._toHumanReadableFieldName(`${_parentName}.${_fieldName}`);
        let normalizedValue = value;

        // If the array is not required and the value is undefined or null,
        // short-circuit with a success.
        if (!Validator._isRequired(array) && (value === undefined || value === null)) {
            return ValidationResult.success();
        }

        // If the array is a stringified JSON array and array strict mode is
        // disabled, parse it.
        if (!this.options.strictArrays) {
            if (typeof value === 'string'
                && value.trim().startsWith('[')
                && value.trim().endsWith(']')) {

                try {
                    normalizedValue = JSON.parse(value);
                } catch (_) {
                    // If the value is not a valid JSON array, we know it cannot
                    // pass validation. Do nothing as it will be caught by the
                    // next if statement checking if the value is an array.
                }

            }
        }

        // If the value is not an array, we know it cannot pass validation.
        if (!Array.isArray(normalizedValue)) {
            // If we're evaluating the root object against an object schema,
            // but the value is not an object, we know the object is missing
            // and thus the payload is invalid.
            if (_parentName === undefined && _fieldName === '$root') {
                return ValidationResult.fail('The submitted value is invalid.');
            }

            return ValidationResult.fail(`The '${arrayName}' field is missing or invalid.`);
        }

        // Overwrite the value with the normalized value to avoid mistakes.
        value = normalizedValue;

        // Check the array length.
        // Empty arrays are only valid if the array is made optional with an
        // empty array schema.
        if (value.length === 0) {
            if (array.length === 0 || array.every(entry => !Validator._isRequired(entry))) {
                return ValidationResult.success();
            } else {
                if (_parentName === undefined && _fieldName === '$root') {
                    return ValidationResult.fail(`The submitted value must contain at least one entry.`);
                }

                return ValidationResult.fail(`The '${arrayName}' field must contain at least one entry.`);
            }
        }

        // If the schema is an array of arrays, return the result of validating
        // the nested array.
        if (Validator._isValidationSchemaArray(array[0])) {
            // If the array is an array of arrays, we know the array must be
            // nested, so we can simply return the result of validating the
            // nested array.
            return value.every((entry: any) => this.validateSchemaAgainstArray(
                array[0] as ValidationSchemaArray,
                entry,
                _entireObject,
                _fieldName,
                _parentName
            ).success)
                ? ValidationResult.success()
                : ValidationResult.fail(
                    _parentName === undefined && _fieldName === '$root'
                        ? `The submitted value contains invalid entries.`
                        : `The '${arrayName}' field contains invalid entries.`);
        }

        // If the schema is an array of objects, return the result of validating
        // the nested object.
        if (Validator._isValidationSchemaObject(array[0])) {
            return value.every((entry: any) => this.validateSchemaAgainstObject(
                array[0] as ValidationSchemaObject,
                entry,
                _entireObject,
                _fieldName,
                _parentName
            ).success)
                ? ValidationResult.success()
                : ValidationResult.fail(_parentName === undefined && _fieldName === '$root'
                    ? `The submitted value contains invalid entries.`
                    : `The '${arrayName}' field contains invalid entries.`);
        }

        // If the schema is an array of fields, return the result of validating
        // the nested fields.
        let readableIndex = 1;
        for (let entry of value) {
            let result = this.validateSchemaAgainstField(
                array[0] as ValidationSchemaField,
                entry,
                _entireObject,
                _fieldName,
                _parentName
            );

            // If any of the fields fail validation, short-circuit and return
            // the result of that field's validation.
            if (!result.success) {
                return Validator._fail({
                    field: array[0] as ValidationSchemaField,
                    fieldName: _fieldName !== '$root'
                        ? `${Validator._toOrdinalNumber(readableIndex)} ${_fieldName}`
                        : `${Validator._toOrdinalNumber(readableIndex)}`,
                    parentName: _parentName
                });
            }

            readableIndex++;
        }

        return ValidationResult.success();
    }

    private validateSchemaAgainstField(field: ValidationSchemaField, value: any, _entireObject?: any, fieldName?: string, parentName?: string) : ValidationResult {
        fieldName = field.fieldName ?? fieldName;

        // If the field type is 'OneOf', check each of the possible schemas by
        // re-running the _validateAgainstSchemaField method.
        if (field.type === _FieldTypesSupportedByExecutor.OneOf) {
            // If any of the possible schemas match, then we know this field is
            // good, so we can simply return true.
            for (const possibleSchema of field.possibleSchemas) {
                let childFieldValidation: ValidationResult;

                if (Validator._isValidationSchemaObject(possibleSchema)) {
                    childFieldValidation = this.validateSchemaAgainstObject(possibleSchema as ValidationSchemaObject, value, _entireObject);
                } else if (Validator._isValidationSchemaArray(possibleSchema)) {
                    childFieldValidation = this.validateSchemaAgainstArray(possibleSchema as ValidationSchemaArray, value, _entireObject);
                } else {
                    childFieldValidation = this.validateSchemaAgainstField(possibleSchema as ValidationSchemaField, value, _entireObject);
                }

                if (childFieldValidation.success) return childFieldValidation;
            }


            return Validator._fail({
                field,
                fieldName,
                parentName,
                defaultMessage: parentName === undefined && fieldName === '$root'
                    ? 'The submitted value does not match any of the expected values.'
                    : 'The ${fieldName} field does not match any of the expected values.'
            });
        }

        if (field.required !== undefined
                && field.required !== null
                && field.required !== false
                && field.required !== true
                && field.required !== 'explicit') {
            throw new Error("You may only set a field's required property to true, false or 'explicit'.");
        }

        // Check common field values.
        if (field.required !== undefined && field.required !== null && field.required !== false) {
            if (field.required === true && ( value === undefined || value === null )) return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be set and not null.' });
            else if (field.required === 'explicit') {
                if ( value === undefined ) {
                    // If the field is explicitly required, but the value is
                    // undefined, this is not allowed, so we can short-circuit
                    // and return false.
                    return Validator._fail({
                        field,
                        fieldName,
                        parentName,
                        defaultMessage: 'The ${fieldName} field must be set.'
                    });
                } else if ( value === null ) {
                    // If the field is explicitly required, but the value is
                    // null, this is allowed, so we can short-circuit and
                    // return true.
                    return ValidationResult.success();
                }
            }
        } else if (field.required === false || field.required === undefined) {
            // If validation of the field is not required and the field is not
            // present, simply short-circuit by returning true.
            if (value === undefined || value == null) return ValidationResult.success();
        }

        if (field.equals && field.arrayEquals) {
            throw new Error('You may not specify equals AND arrayEquals; they are mutually exclusive.');
        }

        if (field.equals !== undefined && field.equals !== null) {
            // If it's an array, ensure at least some entry in field.equals is
            // equal to the current value.
            // If the value is an array, we won't allow it.
            if (Array.isArray(field.equals) && !Array.isArray(value)) {
                // If not, short circuit and return false.
                if (!field.equals.some(entry => value === entry)) {
                    return Validator._fail({
                        field,
                        fieldName,
                        parentName,
                        defaultMessage: 'The ${fieldName} field was not set to a valid value. Possible values are: ' + JSON.stringify(field.equals)
                    });
                }
            // Otherwise, if it's just an object, simply make sure if
            // field.equals in the schema is equal to the current value.
            } else {
                if (value !== field.equals) {
                    return Validator._fail({
                        field,
                        fieldName,
                        parentName,
                        defaultMessage: 'The ${fieldName} field must be equal to: ' + field.equals
                    });
                }
            }
        }

        if (field.arrayEquals !== undefined && field.arrayEquals !== null) {
            // If every entry in arrayEquals is an array, then we know we're
            // dealing with a nested array and thus should check if our array
            // is included.
            if ((field.arrayEquals as any[]).every(entry => Array.isArray(entry))) {
                if (!(field.arrayEquals as any[][]).some(entry => arrayEquals(entry, value)))
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field was not set to a valid value. Possible values are: ' + JSON.stringify(field.arrayEquals) });
            // Otherwise, simply compare the field.arrayEquals array to the
            // value, to ensure they're equal.
            } else {
                if (!arrayEquals(field.arrayEquals, value))
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be equal to: ' + field.arrayEquals });
            }
        }

        if (field.matches !== undefined && field.matches !== null) {
            if (field.matches instanceof RegExp) {
                if (!field.matches.test(value)) return Validator._fail({ field, fieldName, parentName });
            } else {
                if (field.matches['$any'] && field.matches['$all'])
                    throw new Error("You may not have $any and $all specified on a field's 'matches' property; they are mutually exclusive.");

                let comparisonFunc: 'some' | 'every' | undefined;
                let aggregateOp: '$any' | '$all' | undefined;
                if (field.matches.$any) { aggregateOp = '$any'; comparisonFunc = 'some'; }
                if (field.matches.$all) { aggregateOp = '$all'; comparisonFunc = 'every'; }

                if (comparisonFunc && aggregateOp) {
                    if (! ((field.matches[aggregateOp] as RegExp[])[comparisonFunc]((expression: RegExp) => expression.test(value))) )
                        return Validator._fail({ field, fieldName, parentName });
                } else throw new Error('Invalid matches property. Must be a regular expression (regex), or an aggregate expression with $any or $all operator.');
            }
        }

        if (field.$eq !== undefined) {
            if (_entireObject) {
                if (resolveObjectDeep(field.$eq, _entireObject) !== value)
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be equal to the ' + Validator._toHumanReadableFieldName(_entireObject[field.$eq].fieldName ?? field.$eq) + ' field.' });
            } else throw new Error('The $eq operator may not be used on a field outside of an object context.');
        }

        // Now check type-specific field values.
        let attrs : _ValidationSchemaFieldSmartAttributeObject = {};
        switch (field.type) {
            case _FieldTypesSupportedByExecutor.Any:
                return ValidationResult.success();

            case _FieldTypesSupportedByExecutor.String:
                if ((field.strict ?? true) && typeof value !== 'string')
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} must be a string of text.' });

                attrs.minLength = field.minLength;
                attrs.maxLength = field.maxLength;
                Validator._evaluateAttributeValues(attrs, _entireObject);

                if ((attrs.minLength !== undefined && value.length < attrs.minLength) || (attrs.maxLength !== undefined && value.length > attrs.maxLength))
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be at least ' + attrs.minLength + ` character${attrs.minLength !== 1 ? 's' : ''}` + ' and at most ' + attrs.maxLength + ` character${attrs.maxLength !== 1 ? 's' : ''}` + '.' });

                return ValidationResult.success();

            case _FieldTypesSupportedByExecutor.Boolean:
                if (value !== false && value !== true)
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} must be either true or false.' });

                return ValidationResult.success();

            case _FieldTypesSupportedByExecutor.Number:
                if ((field.strict ?? true) ? typeof value !== 'number' : Number.isNaN(value))
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} must be a number.' });

                attrs.min = field.min;
                attrs.max = field.max;
                Validator._evaluateAttributeValues(attrs, _entireObject);

                if ((attrs.min !== undefined && value < attrs.min) || (attrs.max !== undefined && value > attrs.max))
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be at least ' + attrs.min + ' and at most ' + attrs.max + ' in value.' });

                return ValidationResult.success();

            default:
                throw new Error(`Invalid or unimplemented validation type '${(field as any).type}' encountered!`);
        }
    }

    private static _evaluateAttributeValues(attrs: _ValidationSchemaFieldSmartAttributeObject, entireObjectToValidate: any) {
        for (const key of Object.values(attrs)) {
            const entry = attrs[key];

            if (typeof entry === 'object' && (typeof entry['$eq'] === 'string' || typeof entry['$eval'] === 'function')) {
                if (typeof entry['$eq'] === 'string' && typeof entry['$eval'] === 'function')
                    throw new Error('You cannot set both $eq and $eval attribute operators. They are mutually exclusive.');

                if (typeof entry['$eval'] === 'function') {
                    attrs[key] = entry['$eval'](entireObjectToValidate);
                } else if (typeof entry['$eq'] === 'string') {
                    attrs[key] = resolveObjectDeep(entry['$eq'], entireObjectToValidate);
                }
            }

        }
    }

    private static _fail(options: _ExecutorValidationFailOptions) : ValidationResult {
        return ValidationResult.fail(Validator._badFieldMessage(options));
    }

    private static _badFieldMessage(options: _ExecutorValidationFailOptions) {
        const message = options.field.invalidMessage ?? options.defaultMessage ?? 'The ${fieldName} field was invalid.';
        let parentPrefix = options.parentName !== undefined ? `${options.parentName}.` : '';
        return message.replace(/\$\{fieldName}/g, Validator._toHumanReadableFieldName(`${parentPrefix}${options.fieldName}`));
    }

    private static _toOrdinalNumber(value: number) {
        switch (value % 10) {
            case 1:
                return `${value}${value % 100 === 11 ? 'th' : 'st'}`;
            case 2:
                return `${value}${value % 100 === 12 ? 'th' : 'nd'}`;
            case 3:
                return `${value}${value % 100 === 13 ? 'th' : 'rd'}`;
            default:
                return `${value}th`;
        }
    }

    private static _toHumanReadableFieldName(fieldName: string) {
        return fieldName
            // If the fieldName starts with '$root.', remove that part.
            .replace(/^\$root\./, '')
            // Replace a period (.) with a graphical breadcrumb representation.
            .replace('.', ' > ')
            // Replace underscores and hyphens with spaces.
            .replace('_', ' ')
            .replace('-', '')
            // Replace all capital letters not at the start with a space,
            // followed by the letter in lowercase.
            .replace(/(?<!^)[A-Z]/g, (char) => ' ' + char.toLowerCase());
    }

    /**
     * Checks if the specified object is a validation schema object (true) or
     * something else (false).
     * @param value The object to check.
     * @return {boolean} isValidationSchemaObject - true if the specified value
     * is a validation schema object, false if it's an array or field.
     * @private
     */
    private static _isValidationSchemaObject(value: any) : boolean {
        if (typeof value !== 'object' || Array.isArray(value)) return false;

        if (Object.values(value).length === 0) return false;

        // If our object solely consists of entry values that are validation
        // schema fields, we know this must be a validation schema object.
        for (let entry of Object.values(value)) {
            // If it has a string 'type' entry, we know this entry must be a
            // field. Otherwise, it's something else, meaning the parent
            // cannot be a validation schema object.
            if ((!(entry as any)['type']
                || typeof ((entry as any)['type']) !== 'string')
                && !this._isValidationSchemaObject(entry as any)
                && !this._isValidationSchemaArray(entry as any))
                return false;
        }

        return true;
    }

    /**
     * Checks if the specified object is a validation schema array (true) or
     * something else (false).
     * @param value The object to check.
     * @return {boolean} isValidationSchemaArray - true if the specified value
     * is a validation schema array, false if it's an object or field.
     * @private
     */
    private static _isValidationSchemaArray(value: any) : boolean {
        // For now, we'll just check the type of the value.
        return Array.isArray(value);
    }

    /**
     * Checks whether a validation schema field is required, based on its
     * 'required' attribute or type.
     *
     * - Objects are required if any of their children are required.
     * - Arrays are required if their length is greater than 0 and the array
     *   entry schema is required.
     * - Fields are required if their 'required' attribute is specified and not
     *   false.
     *
     * @param value The validation schema field to check.
     * @private
     */
    private static _isRequired(value: ValidationSchemaNestable) {
        if (Validator._isValidationSchemaArray(value)) {
            value = value as ValidationSchemaArray;
            return value.length === 0 || Validator._isRequired(value[0]);
        } else if (Validator._isValidationSchemaObject(value)) {
            value = value as ValidationSchemaObject;
            return Object.values(value).some(entry => Validator._isRequired(entry));
        } else return value['required'] !== undefined && value['required'] !== false;
    }

    /**
     * Checks the specified schema for any errors at compile-time (i.e., before
     * validation is performed).
     *
     * This is intended to augment the checking done by TypeScript at actual
     * compile-time (or even authoring-time), and is not intended to be a
     * replacement for TypeScript's type checking. This is a failsafe for when
     * TypeScript's type checking is erroneously bypassed (or has to be
     * bypassed for some strange reason).
     *
     * @param schema The schema to check.
     * @private
     */
    private static _checkSchema(schema: ValidationSchema) {
        if (Validator._isValidationSchemaObject(schema)) {
            for (let entry of Object.values(schema)) {
                Validator._checkSchema(entry as ValidationSchemaNestable);
            }
        } else if (Validator._isValidationSchemaArray(schema)) {
            Validator._checkSchema(schema[0] as ValidationSchemaNestable);
        } else {
            schema = schema as ValidationSchemaField;

            if (schema.type === 'OneOf') {
                for (let entry of schema.possibleSchemas) {
                    Validator._checkSchema(entry as ValidationSchemaNestable);
                }
            } else {
                this._checkSchemaField(schema);
            }
        }
    }

    /**
     * Checks an individual field in a schema for any errors at compile-time
     * (i.e., before validation is performed).
     *
     * @param field The field to check.
     * @see _checkSchema
     * @private
     */
    private static _checkSchemaField(field: ValidationSchemaField) {
        if (field.type === null || field.type === undefined) {
            throw new Error('You must specify a type for each field in the validation schema.');
        }

        let type = field.type;
        let acceptableTypes: ValidationSchemaField['type'][] = Object.values(_FieldTypesSupportedByExecutor);

        if (!acceptableTypes.includes(type)) {
            throw new Error(`The specified type '${type}' is not supported. Supported types are: ${acceptableTypes.join(', ')}.`);
        }
    }

}
