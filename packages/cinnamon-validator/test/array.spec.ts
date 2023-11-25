import { createValidator, ValidationSchema, ValidatorOptions } from '@apollosoftwarexyz/cinnamon-validator/src/main';
import * as assert from 'assert';

describe('Cinnamon Array Validation', () => {

    describe('createValidator', () => {

        it('can be initialized with an array schema', () => {
            createValidator([
                {
                    name: {
                        type: 'string',
                        required: true,
                        minLength: 3,
                        maxLength: 255
                    },
                    age: {
                        type: 'number',
                        required: true,
                        min: 18,
                        max: 100,
                        integer: true,
                    }
                },
            ]);
        });

    });

    describe('Array Validator', () => {

        const testValidator = (required: boolean = true, options?: ValidatorOptions) => createValidator([
            {
                name: {
                    type: 'string',
                    required: required,
                    minLength: 3,
                    maxLength: 255
                },
                age: {
                    type: 'number',
                    required: required,
                    min: 18,
                    max: 100,
                    integer: true,
                }
            },
        ], options);

        describe('Empty payloads', () => {

            it('accepts an empty array when no fields are required', () => {
                assert.equal(testValidator(false).validate([])[0].success, true);
            });

            it('rejects an empty array when fields are required', () => {
                assert.equal(testValidator(true).validate([])[0].success, false);
                assert.equal(testValidator(true).validate([])[0].message, 'The submitted value must contain at least one entry.');
            });

            it ('rejects an empty array when just one field is required', () => {
                let customValidator = createValidator([
                    {
                        name: {
                            type: 'string',
                            required: true,
                            minLength: 3,
                            maxLength: 255
                        },
                        age: {
                            type: 'number',
                            required: false,
                            min: 18,
                            max: 100,
                            integer: true,
                        }
                    },
                ]);

                assert.equal(customValidator.validate([])[0].success, false);
                assert.equal(customValidator.validate([])[0].message, 'The submitted value must contain at least one entry.');
            });

        });

        describe('Invalid payloads', () => {

            it('rejects non-arrays', () => {
                assert.equal(testValidator().validate(undefined)[0].success, false);
                assert.equal(testValidator().validate(undefined)[0].message, 'The submitted value is invalid.');

                assert.equal(testValidator().validate(null)[0].success, false);
                assert.equal(testValidator().validate(null)[0].message, 'The submitted value is invalid.');

                assert.equal(testValidator().validate(3)[0].success, false);
                assert.equal(testValidator().validate(3)[0].message, 'The submitted value is invalid.');

                assert.equal(testValidator().validate('')[0].success, false);
                assert.equal(testValidator().validate('')[0].message, 'The submitted value is invalid.');

                assert.equal(testValidator().validate('hello')[0].success, false);
                assert.equal(testValidator().validate('hello')[0].message, 'The submitted value is invalid.');

                assert.equal(testValidator().validate(false)[0].success, false);
                assert.equal(testValidator().validate(false)[0].message, 'The submitted value is invalid.');

                assert.equal(testValidator().validate(true)[0].success, false);
                assert.equal(testValidator().validate(true)[0].message, 'The submitted value is invalid.');
            });

            it('rejects an array with an invalid entry', () => {
                let badArray = [{
                    name: 'John',
                    age: 17
                }];

                assert.equal(testValidator().validate(badArray)[0].success, false);
                assert.equal(testValidator().validate(badArray)[0].message, 'The submitted value contains invalid entries.');

                let invalidArray = [{
                    name: 'Gareth',
                }];

                assert.equal(testValidator().validate(invalidArray)[0].success, false);
                assert.equal(testValidator().validate(invalidArray)[0].message, 'The submitted value contains invalid entries.');
            });

        });

        describe('Correctly validates arrays', () => {

            let testArrayOneElement = [{
                name: 'John',
                age: 18
            }];

            let testArrayTwoElements = [{
                name: 'John',
                age: 18
            }, {
                name: 'Jane',
                age: 19
            }];

            let testArrayBadOneElement = [{
                name: 'Gareth',
                age: 17
            }];

            let testArrayBadTwoElements = [{
                name: 'Jeremy',
                age: 18
            }, {
                name: 'Janet',
                age: 101
            }];

            it('accepts a valid array with one element', () => {
                assert.equal(testValidator().validate(testArrayOneElement)[0].success, true);
            });

            it('accepts a valid array with two elements', () => {
                assert.equal(testValidator().validate(testArrayTwoElements)[0].success, true);
            });

            it('rejects an invalid array with one element', () => {
                assert.equal(testValidator().validate(testArrayBadOneElement)[0].success, false);
                assert.equal(testValidator().validate(testArrayBadOneElement)[0].message, 'The submitted value contains invalid entries.');
            });

            it('rejects an invalid array with two elements', () => {
                assert.equal(testValidator().validate(testArrayBadTwoElements)[0].success, false);
                assert.equal(testValidator().validate(testArrayBadTwoElements)[0].message, 'The submitted value contains invalid entries.');
            });

        });

        describe('Has natural error messages', () => {

            let topLevelSchema: ValidationSchema = [{
                type: 'boolean',
                equals: true,
            }];

            let nestedSchema: ValidationSchema = {
                foo: topLevelSchema,
            };

            type Transformer = (array: boolean[]) => any;
            let validatePosition = (position: number,
                schema: ValidationSchema = topLevelSchema,
                transform?: Transformer) =>
                createValidator(schema).validate((() => {
                    let array: boolean[] = Array(position).fill(true);
                    array[position] = false;
                    return transform != null ? transform(array) : array;
                })());
            let validatePositionNested = (position: number) =>
                validatePosition(position, nestedSchema, (array: boolean[]) => {
                    return {
                        foo: array
                    };
                });

            it('has a natural error message for top-level elements', () => {
                assert.equal(validatePosition(0)[0].success, false);
                assert.equal(validatePosition(1)[0].success, false);
                assert.equal(validatePosition(2)[0].success, false);
                assert.equal(validatePosition(3)[0].success, false);
                assert.equal(validatePosition(205)[0].success, false);

                assert.equal(validatePosition(0)[0].message, 'The 1st field was invalid.');
                assert.equal(validatePosition(1)[0].message, 'The 2nd field was invalid.');
                assert.equal(validatePosition(2)[0].message, 'The 3rd field was invalid.');
                assert.equal(validatePosition(3)[0].message, 'The 4th field was invalid.');
                assert.equal(validatePosition(205)[0].message, 'The 206th field was invalid.');
            });

            it('has a natural error message for nested elements', () => {
                assert.equal(validatePositionNested(0)[0].success, false);
                assert.equal(validatePositionNested(1)[0].success, false);
                assert.equal(validatePositionNested(2)[0].success, false);
                assert.equal(validatePositionNested(3)[0].success, false);
                assert.equal(validatePositionNested(205)[0].success, false);

                assert.equal(validatePositionNested(0)[0].message, 'The 1st foo field was invalid.');
                assert.equal(validatePositionNested(1)[0].message, 'The 2nd foo field was invalid.');
                assert.equal(validatePositionNested(2)[0].message, 'The 3rd foo field was invalid.');
                assert.equal(validatePositionNested(3)[0].message, 'The 4th foo field was invalid.');
                assert.equal(validatePositionNested(205)[0].message, 'The 206th foo field was invalid.');
            });

        });

        describe('Stringified Arrays', () => {

            it('can be validated', () => {
                assert.equal(testValidator().validate('[{"name":"John","age":18},{"name":"Jane","age":19}]')[0].success, true);
            });

            it('cannot be validated when strict arrays is enabled', () => {
                assert.equal(testValidator(true, {
                    strictArrays: true
                }).validate('[{"name":"John","age":18},{"name":"Jane","age":19}]')[0].success, false);
            });

            it('does not attempt to validate when the string is invalid', () => {
                assert.equal(testValidator().validate('hello')[0].success, false);

                // We use the "[" and "]" as a sentinel value to check if the
                // string might be a stringified array. So, if the string
                // contains "[" or "]" but is not a valid array, it should
                // fail.
                assert.equal(testValidator().validate('[hello]')[0].success, false);
                assert.equal(testValidator().validate('[{name":"John","age":18},{"name":"Jane","age":19}]')[0].success, false);
            });

        });

        describe('Nested Arrays', () => {

            let validator = createValidator([
                [
                    {
                        type: 'boolean',
                        required: true,
                    }
                ]
            ]);

            it('can be validated', () => {
                assert.equal(validator.validate([[true, false, true], [true, false, true]])[0].success, true);
            });

            it('fails to validate when the nested array is invalid', () => {
                assert.equal(validator.validate([[true, 'false', true], [true, false, true]])[0].success, false);
            });

        });

    });

});
