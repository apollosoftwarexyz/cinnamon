import { createValidator } from '@apollosoftwarexyz/cinnamon-validator/src/main';
import * as assert from 'assert';
import { ValidationSchemaField } from '@apollosoftwarexyz/cinnamon-validator/src/validation-schema/core';

describe('Cinnamon Required Fields Validation', () => {

    describe('createValidator', () => {

        it('can be initialized with required fields', () => {
            createValidator({
                messages: [
                    {
                        type: 'string',
                        required: true,
                    },
                ],
                user: {
                    name: {
                        type: 'string',
                        required: false,
                    }
                }
            });
        });

    });

    describe('Required Fields', () => {

        let makeField = (type: ValidationSchemaField['type'], required: ValidationSchemaField['required']) => createValidator({
            type,
            required
        } as ValidationSchemaField);
        let curriedField = (type: ValidationSchemaField['type']) => (required: ValidationSchemaField['required']) => makeField(type, required);

        let numericField = curriedField('number');
        let stringField = curriedField('string');
        let booleanField = curriedField('boolean');
        let anyField = curriedField('any');

        it('should succeed if all required fields are present', () => {
            assert.equal(numericField(true).validate(1)[0].success, true);
            // should we allow the empty string when required?
            // PROS:
            // - it's a string, so it's not undefined or null
            // - allowing it is more flexible, minLength can be used to block
            //   it and those who want to allow it can leave as-is
            // - (in addition to the above) blocking the empty string does not
            //   leave a way to allow empty strings without some specific
            //   provision for it (e.g., 'allowEmptyStrings' which seems
            //   unnecessary and messy)
            // CONS:
            // - it may be undesirable if a value is required, but an empty
            //   string is not a valid value (though minLength can be used)
            assert.equal(stringField(true).validate('')[0].success, true);
            assert.equal(booleanField(true).validate(true)[0].success, true);
            assert.equal(booleanField(true).validate(false)[0].success, true);
            assert.equal(anyField(true).validate({})[0].success, true);

            assert.equal(anyField(true).validate(1)[0].success, true);
            assert.equal(anyField(true).validate(0)[0].success, true);
            assert.equal(anyField(true).validate('')[0].success, true);
            assert.equal(anyField(true).validate('The quick brown fox jumps over the lazy sleeping dog!')[0].success, true);
            assert.equal(anyField(true).validate(true)[0].success, true);
            assert.equal(anyField(true).validate(false)[0].success, true);
        });

        it('should succeed if nothing is specified and no fields are required', () => {
            assert.equal(numericField(false).validate(undefined)[0].success, true);
            assert.equal(stringField(false).validate(undefined)[0].success, true);
            assert.equal(booleanField(false).validate(undefined)[0].success, true);
            assert.equal(anyField(false).validate(undefined)[0].success, true);

            assert.equal(numericField(false).validate(null)[0].success, true);
            assert.equal(stringField(false).validate(null)[0].success, true);
            assert.equal(booleanField(false).validate(null)[0].success, true);
            assert.equal(anyField(false).validate(null)[0].success, true);

            assert.equal(numericField('explicit').validate(null)[0].success, true);
            assert.equal(stringField('explicit').validate(null)[0].success, true);
            assert.equal(booleanField('explicit').validate(null)[0].success, true);
            assert.equal(anyField('explicit').validate(null)[0].success, true);
        });

        it('should fail if a required field is missing', () => {
            assert.equal(numericField(true).validate(undefined)[0].success, false);
            assert.equal(stringField(true).validate(undefined)[0].success, false);
            assert.equal(booleanField(true).validate(undefined)[0].success, false);
            assert.equal(anyField(true).validate(undefined)[0].success, false);

            assert.equal(numericField(true).validate(null)[0].success, false);
            assert.equal(stringField(true).validate(null)[0].success, false);
            assert.equal(booleanField(true).validate(null)[0].success, false);
            assert.equal(anyField(true).validate(null)[0].success, false);

            assert.equal(numericField('explicit').validate(undefined)[0].success, false);
            assert.equal(stringField('explicit').validate(undefined)[0].success, false);
            assert.equal(booleanField('explicit').validate(undefined)[0].success, false);
            assert.equal(anyField('explicit').validate(undefined)[0].success, false);
        });

    });

    describe('Required Nested Fields', () => {

        let testValidator = (required: 'array_values'|'string'|true|false) => createValidator({
            messages: [
                {
                    type: 'string',
                    required: required === 'array_values' || required === true,
                },
            ],
            user: {
                name: {
                    type: 'string',
                    required: required === 'string' || required === true,
                }
            }
        });

        describe('Ignores Un-required Fields', () => {

            it('should accept an empty payload when no fields are required', () => {
                assert.equal(testValidator(false).validate({})[0].success, true);
            });

        });

        describe('Missing Required Fields', () => {

            it('should fail if a required field is missing', () => {
                assert.equal(testValidator(true).validate({})[0].success, false);
                assert.equal(testValidator(true).validate({ user: {} })[0].success, false);
                assert.equal(testValidator(true).validate({ user: { name: 'Hello' } })[0].success, false);
                assert.equal(testValidator(true).validate({ messages: [] })[0].success, false);
            });

        });

    });

});
