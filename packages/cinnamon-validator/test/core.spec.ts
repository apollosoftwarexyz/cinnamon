import * as assert from 'assert';
import { createValidator } from '@apollosoftwarexyz/cinnamon-validator/src/main';

describe('Cinnamon Validator Core', () => {

    describe('createValidator', () => {

        it('can be initialized with createValidator', () => {
            createValidator({
                type: 'string',
                required: true,
                minLength: 3,
                maxLength: 255
            });
        });

    });

    describe('Dodgy Validator Schemas and Payloads', () => {

        it('fails if the schema is empty', () => {
            assert.throws(() => createValidator({}));
        });

        it('can handle an invalid top-level payload for a schema', () => {
            const validator = createValidator({
                foo: {
                    type: 'string',
                    required: true,
                    minLength: 3,
                    maxLength: 255
                }
            });

            const result = validator.validate('{;}');

            // The result should be invalid and the message should be
            // "The submitted value is invalid."
            assert.equal(result[0].success, false);
            assert.equal(result[0].message, 'The submitted value is invalid.');
            assert.equal(result[1], undefined);
        });

        it('gracefully, but correctly, handles an invalid schema at creation', () => {
            assert.throws(() => createValidator({
                type: 'foo',
                required: true,
                minLength: 3,
                maxLength: 255
            } as any));

            let foo = {};

            assert.throws(() => createValidator(foo));
            assert.throws(() => createValidator({
                required: true,
                minLength: 3,
                maxLength: 255
            } as any));

            // TODO: more can be done to check this at creation time but it's
            // TODO: not easy and will probably require deep inspection of the
            // TODO: type system.

            // TODO: it is a high priority that the TypeScript schema
            // TODO: definition is correct and that it is possible to
            // TODO: validate the schema at creation time.
        });

        it('handles illegal values at runtime', () => {
            assert.throws(() => createValidator({
                type: 'string',
                required: 'foo',
                minLength: 3,
                maxLength: 255
            } as any).validate('Hello, world!'));

            assert.throws(() => createValidator({
                type: 'string',
                equals: 'foo',
                arrayEquals: ['foo', 'bar'],
            } as any).validate('Hello, world!'));
        });

    });

});
