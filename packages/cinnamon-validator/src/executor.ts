import ValidationResult from './result';
import { ValidationSchemaFieldSmartAttribute } from './validation-schema/attribute';
import {
    ValidationSchema,
    ValidationSchemaArray,
    ValidationSchemaField,
    ValidationSchemaObject
} from './validation-schema/core';

import cinnamonInternals from '@apollosoftwarexyz/cinnamon-internals';

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

/**
 * A Validator handles performing validation on objects according to the specified schema provided to it when it was
 * initialized.
 */
export class Validator {

    public readonly schema: ValidationSchema;

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
     */
    constructor(schema: ValidationSchema) {
        this.schema = schema;

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
                    value[key],
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
                    value[key],
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
                    value[key],
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

        // If the array is a stringified JSON array, parse it.
        if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
            try {
                normalizedValue = JSON.parse(value);
            } catch (_) {
                // If the value is not a valid JSON array, we know it cannot
                // pass validation.
                return ValidationResult.fail(`The '${arrayName}' field is missing or invalid.`);
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
            if (array.length === 0) {
                return ValidationResult.success();
            } else {
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
                : ValidationResult.fail(`The '${arrayName}' field contains invalid entries.`);
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
                : ValidationResult.fail(`The '${arrayName}' field contains invalid entries.`);
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
                    fieldName: `${Validator._toOrdinalNumber(readableIndex)} ${_fieldName}`, parentName: _parentName
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
        if (field.type === 'OneOf') {
            for (const possibleSchema of field.possibleSchemas) {
                const childFieldValidation = this.validateSchemaAgainstField(possibleSchema, value, _entireObject);
                if (!childFieldValidation.success)
                    return childFieldValidation;
            }

            // If validation passes on all of the possible schemas, then we know
            // this field must be good, so we can simply return true.
            return ValidationResult.success();
        }

        // Check common field values.
        if (field.required !== undefined && field.required !== null && field.required !== false) {
            if (field.required === true && ( value === undefined || value === null )) return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be set and not null.' });
            else if (field.required === 'explicit' && ( value === undefined )) return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be set.' });
        } else if (field.required === false || field.required === undefined) {
            // If validation of the field is not required and the field is not
            // present, simply short-circuit by returning true.
            if (value === undefined || value == null) return ValidationResult.success();
        } else {
            throw new Error("You may only set a field's required property to true, false or 'explicit'.");
        }

        if (field.equals && field.arrayEquals) {
            throw new Error('You may not specify equals AND arrayEquals; they are mutually exclusive.');
        }

        if (field.equals !== undefined && field.equals !== null) {
            // If it's an array, ensure at least some entry in field.equals is
            // equal to the current value.
            //
            // EDGE CASE: make sure we don't attempt this check if the current
            // value is an array. (In which case, arrayEquals should be used)
            if (Array.isArray(field.equals) && !Array.isArray(value)) {
                // If not, short circuit and return false.
                if (!field.equals.some(entry => value === entry))
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field was not set to a valid value. Possible values are: ' + JSON.stringify(field.equals) });
            // Otherwise, if it's just an object, simply make sure if
            // field.equals in the schema is equal to the current value.
            } else {
                if (value !== field.equals)
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be equal to: ' + field.equals });
            }
        }

        if (field.arrayEquals !== undefined && field.arrayEquals !== null) {
            // If every entry in arrayEquals is an array, then we know we're
            // dealing with a nested array and thus should check if our array
            // is included.
            if ((field.arrayEquals as any[]).every(entry => Array.isArray(entry))) {
                if (!(field.arrayEquals as any[][]).some(entry => cinnamonInternals.data.arrayEquals(entry, value)))
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field was not set to a valid value. Possible values are: ' + JSON.stringify(field.arrayEquals) });
            // Otherwise, simply compare the field.arrayEquals array to the
            // value, to ensure they're equal.
            } else {
                if (!cinnamonInternals.data.arrayEquals(field.arrayEquals, value))
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
                if (cinnamonInternals.data.resolveObjectDeep(field.$eq, _entireObject) !== value)
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be equal to the ' + Validator._toHumanReadableFieldName(_entireObject[field.$eq].fieldName ?? field.$eq) + ' field.' });
            } else throw new Error('The $eq operator may not be used on a field outside of an object context.');
        }

        // Now check type-specific field values.
        let attrs : _ValidationSchemaFieldSmartAttributeObject = {};
        switch (field.type) {
            case 'any':
                return ValidationResult.success();

            case 'string':
                attrs.minLength = field.minLength;
                attrs.maxLength = field.maxLength;
                Validator._evaluateAttributeValues(attrs, _entireObject);

                if ((attrs.minLength !== undefined && value.length < attrs.minLength) || (attrs.maxLength !== undefined && value.length > attrs.maxLength))
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be at least ' + attrs.minLength + ` character${attrs.minLength !== 1 ? 's' : ''}` + ' and at most ' + attrs.maxLength + ` character${attrs.maxLength !== 1 ? 's' : ''}` + '.' });

                return ValidationResult.success();

            case 'boolean':
                if (value !== false && value !== true)
                    return Validator._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} must be either true or false.' });

                return ValidationResult.success();

            case 'number':
                if (isNaN(value))
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
                    attrs[key] = cinnamonInternals.data.resolveObjectDeep(entry['$eq'], entireObjectToValidate);
                }
            }

        }
    }

    private static _fail(options: _ExecutorValidationFailOptions) : ValidationResult {
        return ValidationResult.fail(Validator._badFieldMessage(options));
    }

    private static _badFieldMessage(options: _ExecutorValidationFailOptions) {
        const message = options.field.invalidMessage ?? options.defaultMessage ?? 'The ${fieldName} field was invalid.';
        return message.replace(/\$\{fieldName}/g, Validator._toHumanReadableFieldName(`${options.parentName}.${options.fieldName}`));
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

        // If our object solely consists of entry values that are validation
        // schema fields, we know this must be a validation schema object.
        for (let entry of Object.values(value)) {
            // If it has a string 'type' entry, we know this entry must be a
            // field. Otherwise, it's something else, meaning the parent
            // cannot be a validation schema object.
            if ((!(entry as any)['type'] || typeof ((entry as any)['type']) !== 'string') && !this._isValidationSchemaObject(entry as any) && !this._isValidationSchemaArray(entry as any))
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

}
