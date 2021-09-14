"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationSchemaExecutor = void 0;
/**
 * A Validation Schema Executor handles performing validation on objects according to the specified
 * schema provided to it when it was initialized.
 */
class ValidationSchemaExecutor {
    /**
     * Initializes a ValidationSchemaExecutor with the specified schema. Once initialized, the
     * schema may not be changed (you should use a new ValidationSchemaExecutor for a new schema).
     *
     * @param schema The schema the ValidationSchemaExecutor should perform validation with.
     */
    constructor(schema) {
        this.schema = schema;
        this.isSingleFieldSchema = this._isValidationSchemaObject(this.schema);
    }
    /**
     * Performs validation on the specified value according to the executor's specified schema.
     * If validation passes, this method returns true, otherwise it returns false.
     *
     * @param value The value to check (perform validation) against the schema.
     */
    validate(value) {
        if (this.isSingleFieldSchema) {
            return this._validateField(this.schema, value);
        }
        return true;
    }
    _validateObject(object, value) {
        // Loop over every key in the current object.
        for (let key of Object.keys(object)) {
            // If the entry at key in the schema is 
            if (this._isValidationSchemaObject(object[key])) {
                if (!this._validateObject(object[key], value[key]))
                    return false;
            }
            else if (!this._validateField(object[key], value[key]))
                return false;
        }
        return true;
    }
    _validateField(field, value) {
        return true;
    }
    /**
     * Checks if the specified object is a validation schema object (true) or
     * a single validation schema field (false).
     * @param  value               The object to check.
     * @return       True if it's a validation schema object, false if it's just
     * a validation shema field.
     */
    _isValidationSchemaObject(value) {
        // If our object solely consists of entry values that are validation
        // schema fields, we know this must be a validation schema object.
        for (let entry of Object.values(value)) {
            // If it has a string 'type' entry, we know this entry must be a
            // field. Otherwise, it's something else, meaning the parent
            // cannot be a validation schema object.
            if (!entry['type'] || typeof (entry['type']) !== 'string')
                return false;
        }
        return true;
    }
}
exports.ValidationSchemaExecutor = ValidationSchemaExecutor;
