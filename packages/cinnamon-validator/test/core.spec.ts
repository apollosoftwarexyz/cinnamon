import * as assert from 'assert';
import { createValidator } from '@apollosoftwarexyz/cinnamon-validator';

describe('Cinnamon Validator Core', () => {

    describe('createValidator', () => {

        it('can be initialized with createValidator', () => {
            createValidator({});
        });

    });

    describe('Validator', () => {

        it('can handle an empty payload for a schema', () => {
            const validator = createValidator({});
            const result = validator.validate('{;}');

            // The result should be invalid and the message should be
            // "The submitted value is invalid."
            assert.equal(result[0].success, false);
            assert.equal(result[0].message, 'The submitted value is invalid.');
            assert.equal(result[1], undefined);
        });

    });

});
