"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const result_1 = require("./result");
const cinnamon_internals_1 = require("@apollosoftwarexyz/cinnamon-internals");
/**
 * A Validator handles performing validation on objects according to the specified schema provided to it when it was
 * initialized.
 */
class Validator {
    schema;
    /**
     * Whether or not the schema on this executor is for a single field (i.e.. a
     * validation schema field) (= true) or for an entire object (i.e., a
     * validation schema object) (= false).
     */
    isSingleFieldSchema;
    /**
     * Initializes a ValidationSchemaExecutor with the specified schema. Once initialized, the
     * schema may not be changed (you should use a new ValidationSchemaExecutor for a new schema).
     *
     * @param schema The schema the ValidationSchemaExecutor should perform validation with.
     */
    constructor(schema) {
        this.schema = schema;
        this.isSingleFieldSchema = !Validator._isValidationSchemaObject(this.schema);
    }
    /**
     * Performs validation on the specified value according to the executor's specified schema.
     * If validation passes, this method returns true, otherwise it returns false.
     *
     * @param value The value to check (perform validation) against the schema.
     * @return result An array, with the first index (0) being the validation result, and the
     * second (1) being either the inputted value if it was valid, or undefined if it wasn't.
     */
    validate(value) {
        let result;
        if (this.isSingleFieldSchema) {
            result = this.validateSchemaAgainstField(this.schema, value, undefined, '$root', undefined);
        }
        else {
            result = this.validateSchemaAgainstObject(this.schema, value, value, '$root', undefined);
        }
        return [result, result.success ? value : undefined];
    }
    validateSchemaAgainstObject(object, value, _entireObject, _fieldName, _parentName) {
        // We're attempting to validate against an object, so if the value in question is not
        // an object, clearly it does not meet validation.
        if (typeof value !== 'object') {
            let objectName = this._toHumanReadableFieldName(`${_parentName}.${_fieldName}`);
            return result_1.default.fail(`The '${objectName}' field is missing.`);
        }
        // Loop over every key in the current object.
        for (let key of Object.keys(object)) {
            // If the entry at key in the schema is a validation schema object,
            // then validate against the object (recursively if necessary.)
            if (Validator._isValidationSchemaObject(object[key])) {
                // Immediately fail validation if a child schema fails
                // validation.
                const childSchemaValidation = this.validateSchemaAgainstObject(object[key], value[key], _entireObject, key, `${_parentName !== undefined ? _parentName + '.' : ''}${_fieldName}`);
                if (!childSchemaValidation.success)
                    return childSchemaValidation;
                // Otherwise, if the current entry is a field, attempt to validate
                // that sole field, again, immediately failing validation if that
                // field fails validation.
            }
            else {
                const childFieldValidation = this.validateSchemaAgainstField(object[key], value[key], _entireObject, key, `${_parentName !== undefined ? _parentName + '.' : ''}${_fieldName}`);
                if (!childFieldValidation.success)
                    return childFieldValidation;
            }
        }
        // If all the above checks have completed without 'short-circuiting',
        // then we may reasonably conclude validation must have passed.
        return result_1.default.success();
    }
    validateSchemaAgainstField(field, value, _entireObject, fieldName, parentName) {
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
            return result_1.default.success();
        }
        // Check common field values.
        if (field.required !== undefined && field.required !== null && field.required !== false) {
            if (field.required === true && (value === undefined || value === null))
                return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be set and not null.' });
            else if (field.required === 'explicit' && (value === undefined))
                return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be set.' });
        }
        else if (field.required === false || field.required === undefined) {
            // If validation of the field is not required and the field is not
            // present, simply short-circuit by returning true.
            if (value === undefined || value == null)
                return result_1.default.success();
        }
        else {
            throw new Error("You may only set a field's required property to true, false or 'explicit'.");
        }
        if (field.equals && field.arrayEquals) {
            throw new Error("You may not specify equals AND arrayEquals; they are mutually exclusive.");
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
                    return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field was not set to a valid value. Possible values are: ' + JSON.stringify(field.equals) });
                // Otherwise, if it's just an object, simply make sure if
                // field.equals in the schema is equal to the current value.
            }
            else {
                if (value !== field.equals)
                    return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be equal to: ' + field.equals });
            }
        }
        if (field.arrayEquals !== undefined && field.arrayEquals !== null) {
            // If every entry in arrayEquals is an array, then we know we're
            // dealing with a nested array and thus should check if our array
            // is included.
            if (field.arrayEquals.every(entry => Array.isArray(entry))) {
                if (!field.arrayEquals.some(entry => cinnamon_internals_1.default.data.arrayEquals(entry, value)))
                    return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field was not set to a valid value. Possible values are: ' + JSON.stringify(field.arrayEquals) });
                // Otherwise, simply compare the field.arrayEquals array to the
                // value, to ensure they're equal.
            }
            else {
                if (!cinnamon_internals_1.default.data.arrayEquals(field.arrayEquals, value))
                    return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be equal to: ' + field.arrayEquals });
            }
        }
        if (field.matches !== undefined && field.matches !== null) {
            if (field.matches instanceof RegExp) {
                if (!field.matches.test(value))
                    return this._fail({ field, fieldName, parentName });
            }
            else {
                // @ts-ignore
                if (field.matches['$any'] && field.matches['$all'])
                    throw new Error("You may not have $any and $all specified on a field's 'matches' property; they are mutually exclusive.");
                let comparisionFunc;
                let aggregateOp;
                if (field.matches.$any) {
                    aggregateOp = '$any';
                    comparisionFunc = 'some';
                }
                if (field.matches.$all) {
                    aggregateOp = '$all';
                    comparisionFunc = 'every';
                }
                if (comparisionFunc && aggregateOp) {
                    if (!(field.matches[aggregateOp][comparisionFunc]((expression) => expression.test(value))))
                        return this._fail({ field, fieldName, parentName });
                }
                else
                    throw new Error("Invalid matches property. Must be a regular expression (regex), or an aggregate expression with $any or $all operator.");
            }
        }
        if (field.$eq !== undefined) {
            if (_entireObject) {
                if (cinnamon_internals_1.default.data.resolveObjectDeep(field.$eq, _entireObject) !== value)
                    return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be equal to the ' + this._toHumanReadableFieldName(_entireObject[field.$eq].fieldName ?? field.$eq) + ' field.' });
            }
            else
                throw new Error("The $eq operator may not be used on a field outside of an object context.");
        }
        // Now check type-specific field values.
        let attrs = {};
        switch (field.type) {
            case 'any':
                return result_1.default.success();
            case 'string':
                attrs.minLength = field.minLength;
                attrs.maxLength = field.maxLength;
                this._evaluateAttributeValues(attrs, _entireObject);
                if ((attrs.minLength !== undefined && value.length < attrs.minLength) || (attrs.maxLength !== undefined && value.length > attrs.maxLength))
                    return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be at least ' + attrs.minLength + ` character${attrs.minLength !== 1 ? 's' : ''}` + ' and at most ' + attrs.maxLength + ` character${attrs.maxLength !== 1 ? 's' : ''}` + '.' });
                return result_1.default.success();
            case 'boolean':
                if (value !== false && value !== true)
                    return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} must be either true or false.' });
                return result_1.default.success();
            case 'number':
                if (isNaN(value))
                    return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} must be a number.' });
                attrs.min = field.min;
                attrs.max = field.max;
                this._evaluateAttributeValues(attrs, _entireObject);
                if ((attrs.min !== undefined && value < attrs.min) || (attrs.max !== undefined && value > attrs.max))
                    return this._fail({ field, fieldName, parentName, defaultMessage: 'The ${fieldName} field must be at least ' + attrs.min + ' and at most ' + attrs.max + ' in value.' });
                return result_1.default.success();
            default:
                // @ts-ignore
                throw new Error(`Invalid or unimplemented validation type '${field.type}' encountered!`);
        }
    }
    _evaluateAttributeValues(attrs, entireObjectToValidate) {
        for (const key of Object.values(attrs)) {
            const entry = attrs[key];
            if (typeof entry === 'object' && (typeof entry['$eq'] === 'string' || typeof entry['$eval'] === 'function')) {
                if (typeof entry['$eq'] === 'string' && typeof entry['$eval'] === 'function')
                    throw new Error('You cannot set both $eq and $eval attribute operators. They are mutually exclusive.');
                if (typeof entry['$eval'] === 'function') {
                    attrs[key] = entry['$eval'](entireObjectToValidate);
                }
                else if (typeof entry['$eq'] === 'string') {
                    attrs[key] = cinnamon_internals_1.default.data.resolveObjectDeep(entry['$eq'], entireObjectToValidate);
                }
            }
        }
    }
    _fail(options) {
        return result_1.default.fail(this._badFieldMessage(options));
    }
    _badFieldMessage(options) {
        const message = options.field.invalidMessage ?? options.defaultMessage ?? "The ${fieldName} field was invalid.";
        return message.replace(/\$\{fieldName\}/g, this._toHumanReadableFieldName(`${options.parentName}.${options.fieldName}`));
    }
    _toHumanReadableFieldName(fieldName) {
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
     * a single validation schema field (false).
     * @param  value               The object to check.
     * @return {boolean} isValidationSchemaObject - true the specified value is
     * a validation schema object, false if it's just a validation schema field.
     */
    static _isValidationSchemaObject(value) {
        if (typeof value !== 'object')
            return false;
        // If our object solely consists of entry values that are validation
        // schema fields, we know this must be a validation schema object.
        for (let entry of Object.values(value)) {
            // If it has a string 'type' entry, we know this entry must be a
            // field. Otherwise, it's something else, meaning the parent
            // cannot be a validation schema object.
            if ((!entry['type'] || typeof (entry['type']) !== 'string') && !this._isValidationSchemaObject(entry))
                return false;
        }
        return true;
    }
}
exports.Validator = Validator;
