import { createValidator } from "@apollosoftwarexyz/cinnamon-validator";
import * as assert from "assert";

import { User } from './resources/TestSchema';

// Test the core interface for Cinnamon's Validation library.
describe('Cinnamon Validator Core', () => {

    describe('Create Schema Validator', () => {

        it("can be called on a schema's prototype with createValidator", function () {
            const validator = createValidator(User.prototype);
        });

    });

    describe('Validator (Individual Tests)', () => {

        describe('Validating top-level fields', function () {

            describe('Validating common attributes with "any" type', function () {
                // TODO
            });

            describe('Validating string attributes', function () {

            });

            describe('Validating a boolean', function () {

            });

            describe('Validating a number', function () {

            });

        });

    });

    describe('Validator (Real Use Case)', () => {

        createValidator({
            type: 'string',
            required: true,
        });

        createValidator({
            type: 'string',
            required: true,
            username: {
                type: 'string'
            }
        })

        createValidator({
            user: {
                username: {
                    type: 'string',
                    required: true
                }
            }
        });

        // invalid
        createValidator({
            type: 'string', // invalid
            user: {
                type: 'string', // invalid
                username: {
                    type: 'string',
                    required: true
                }
            },
            user2: { // valid
                type: 'string',
                required: true
            }
        })

        /**
         * An example validation schema for a user.
         */
        const exampleUserValidator = createValidator({
            username: {
                type: "string",
                required: true,
                minLength: 2,
                maxLength: 32,
            },
            password: {
                type: "string",
                required: true,
                minLength: 8,
                maxLength: 128,
                matches: {
                    // Ensure the password has all the following:
                    // - lowercase letter
                    // - uppercase letter
                    // - number
                    // - character that is non of the above (i.e., symbol)
                    $all: [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/]
                }
            },
            confirmPassword: {
                type: "string",
                required: true,
                $eq: "password",
            },
            birthYear: {
                type: "number",
                integer: true,
                min: 1900,
                max: (new Date().getFullYear() - 18)
            },
            acceptedTermsOfService: {
                type: "boolean",
                required: true,
                equals: true
            },
            captcha: {
                type: "string",
                invalidMessage: "You must fill out the CAPTCHA correctly!",
                async validator(value) {
                    // If value is a number, return true if it is a number type, if it's not
                    // a number, return true if it is a string type. Otherwise, return false.
                    return isNaN(parseInt(value)) ? typeof value === 'string' : typeof value === 'number';
                }
            }
        });

        const validUser = {
            acceptedTermsOfService: true,
            username: "jharker",
            password: "Helloworld1@",
            confirmPassword: "Helloworld1@",
            birthYear: 1958
        };

        describe('Valid User', () => {

            // const result = exampleUserValidator.validate(validUser);
            //
            // it('should return a success result for a valid object', () => {
            //     assert.strictEqual(result[0].success, true);
            // });
            //
            // it('should return an undefined message for a valid object', () => {
            //     assert.strictEqual(result[0].message, undefined);
            // });
            //
            // it('should return the input object as result[1] for a valid object', () => {
            //     assert.deepEqual(result[1], validUser);
            // });

        });

        describe('Invalid Users', () => {



        });

    });

});
