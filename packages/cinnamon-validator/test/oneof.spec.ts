import { createValidator } from '@apollosoftwarexyz/cinnamon-validator/src/main';
import * as assert from 'assert';

describe('Cinnamon OneOf Validation', () => {

    describe('createValidator', () => {

        it('can be initialized with a "OneOf" spec', () => {
            createValidator({
                type: 'OneOf',
                possibleSchemas: [
                    {
                        usResident: {
                            type: 'boolean',
                            required: true,
                            equals: true,
                        },
                        ssn: {
                            type: 'string',
                            required: true,
                            minLength: 9,
                            maxLength: 9,
                            matches: /^\d{9}$/,
                        }
                    },
                    {
                        usResident: {
                            type: 'boolean',
                            required: true,
                            equals: false,
                        },
                        otherNumber: {
                            type: 'string',
                            required: true,
                            minLength: 4,
                            maxLength: 4,
                            matches: /^\d{4}$/,
                        }
                    }
                ]
            });
        });

    });

    describe('"OneOf" Validator', () => {

        let validator = createValidator({
            type: 'OneOf',
            possibleSchemas: [
                {
                    usResident: {
                        type: 'boolean',
                        required: true,
                        equals: true,
                    },
                    ssn: {
                        type: 'string',
                        required: true,
                        minLength: 9,
                        maxLength: 9,
                        matches: /^\d{9}$/,
                    }
                },
                {
                    usResident: {
                        type: 'boolean',
                        required: true,
                        equals: false,
                    },
                    otherNumber: {
                        type: 'string',
                        required: true,
                        minLength: 4,
                        maxLength: 4,
                        matches: /^\d{4}$/,
                    }
                }
            ]
        });

        it('accepts a valid payload for a "OneOf" spec', () => {

            assert.equal(validator.validate({
                usResident: true,
                ssn: '123456789',
            })[0].success, true);

            assert.equal(validator.validate({
                usResident: false,
                otherNumber: '1234',
            })[0].success, true);

        });

        it('rejects an invalid payload for a "OneOf" spec', () => {

            // Try invalid values.

            assert.equal(validator.validate({
                usResident: true,
                ssn: '12345678A',
            })[0].success, false);
            assert.equal(validator.validate({
                usResident: true,
                ssn: '12345678A',
            })[0].message, 'The submitted value does not match any of the expected values.');

            // Try mixing the two schemas.

            assert.equal(validator.validate({
                usResident: true,
                otherNumber: '1234',
            })[0].success, false);
            assert.equal(validator.validate({
                usResident: true,
                otherNumber: '1234',
            })[0].message, 'The submitted value does not match any of the expected values.');

            assert.equal(validator.validate({
                usResident: false,
                ssn: '123456789',
            })[0].success, false);
            assert.equal(validator.validate({
                usResident: false,
                ssn: '123456789',
            })[0].message, 'The submitted value does not match any of the expected values.');

            // Try missing a required field.

            assert.equal(validator.validate({})[0].success, false);

            // Try breaking it with random values.

            assert.equal(validator.validate({})[0].message, 'The submitted value does not match any of the expected values.');
            assert.equal(validator.validate(null)[0].message, 'The submitted value does not match any of the expected values.');
            assert.equal(validator.validate(undefined)[0].message, 'The submitted value does not match any of the expected values.');
            assert.equal(validator.validate([])[0].message, 'The submitted value does not match any of the expected values.');
            assert.equal(validator.validate('huh??')[0].message, 'The submitted value does not match any of the expected values.');
            assert.equal(validator.validate(702)[0].message, 'The submitted value does not match any of the expected values.');
            assert.equal(validator.validate(false)[0].message, 'The submitted value does not match any of the expected values.');
            assert.equal(validator.validate(true)[0].message, 'The submitted value does not match any of the expected values.');

        });

    });

    describe('"OneOf" with Arrays', () => {

        let arraySchema = createValidator({
            type: 'OneOf',
            possibleSchemas: [
                [{
                    type: 'string',
                    required: true,
                }],
                [{
                    type: 'boolean',
                    required: true,
                }]
            ]
        });

        it('can distinguish between array schemas', () => {
            assert.equal(arraySchema.validate(['hello', 'hi', 'howdy'])[0].success, true);
            assert.equal(arraySchema.validate([true, false, true])[0].success, true);
        });

        it('rejects invalid or mixed arrays', () => {
            assert.equal(arraySchema.validate(['hello', 'hi', 3])[0].success, false);
            assert.equal(arraySchema.validate(['hello', 'hi', false])[0].success, false);
            assert.equal(arraySchema.validate([false, true, 3])[0].success, false);
            assert.equal(arraySchema.validate([false, true, 1])[0].success, false);
            assert.equal(arraySchema.validate([false, true, 0])[0].success, false);
        });

    });

    describe('"OneOf" with fields', () => {

        let validator = createValidator({
            type: 'OneOf',
            possibleSchemas: [
                {
                    type: 'string',
                    equals: 'foo',
                },
                {
                    type: 'string',
                    equals: 'bar',
                }
            ]
        });

        it('distinguishes between fields', () => {
            assert.equal(validator.validate('foo')[0].success, true);
            assert.equal(validator.validate('bar')[0].success, true);
            assert.equal(validator.validate('baz')[0].success, false);
        });

    });

});
