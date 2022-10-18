import { CommonRegExp, Matcher } from "@apollosoftwarexyz/cinnamon-validator";
import * as assert from "assert";

// Test the RegExp 'Matcher' component of Cinnamon's Validation Library.
describe('Cinnamon Validator Matcher', () => {

    // TODO: Test each of the expressions.
    describe('CommonRegExp', () => {

        it('has a correct email regex', () => {
            assert.strictEqual(
                CommonRegExp.email.test('me@example.com'), true,
                'Expected RegExp to test true for good email'
            );
            assert.strictEqual(
                CommonRegExp.email.test('not an email'), false,
                'Expected RegExp to test false for bad email'
            );
        });

        it('has a correct UUID regex', () => {
            assert.strictEqual(
                CommonRegExp.UUID.test('50ff8298-c019-40cd-bdc2-99ccf238731b'), true,
                'Expected RegExp to test true for v4 UUID'
            );

            assert.strictEqual(
                CommonRegExp.UUID.test('837514c4-ed1b-11ec-8ea0-0242ac120002'), true,
                'Expected RegExp to test true for non-v4 UUID'
            );

            assert.strictEqual(
                CommonRegExp.UUID.test('not a UUID'), false,
                'Expected RegExp to test false for non-UUID'
            );
        });

        it('has a correct UUIDv4 regex', () => {
            assert.strictEqual(
                CommonRegExp.UUIDv4.test('50ff8298-c019-40cd-bdc2-99ccf238731b'), true,
                'Expected RegExp to test true for v4 UUID'
            );

            assert.strictEqual(
                CommonRegExp.UUIDv4.test('837514c4-ed1b-11ec-8ea0-0242ac120002'), false,
                'Expected RegExp to test false for non-v4 UUID'
            );

            assert.strictEqual(
                CommonRegExp.UUIDv4.test('not a UUID'), false,
                'Expected RegExp to test false for non-UUID'
            );
        });

        it('has a correct username regex', () => {
            assert.ok(
                [
                    CommonRegExp.username.test('sam'),
                    CommonRegExp.username.test('Sam'),
                    CommonRegExp.username.test('samjakob'),
                    CommonRegExp.username.test('SamJakob'),
                    CommonRegExp.username.test('sam_jakob'),
                    CommonRegExp.username.test('Sam_Jakob'),
                    CommonRegExp.username.test('sam.jakob'),
                    CommonRegExp.username.test('Sam.Jakob'),
                    CommonRegExp.username.test('SamJakob1'),
                    CommonRegExp.username.test('Sam.Jakob1'),
                    CommonRegExp.username.test('Sam_Jakob1'),
                ].every(element => element === true),
                'Expected RegExp to test true for valid usernames'
            );

            assert.strictEqual(
                CommonRegExp.username.test(''), false,
                'Expected RegExp to test false for username that is empty'
            );

            assert.strictEqual(
                CommonRegExp.username.test('test username'), false,
                'Expected RegExp to test false for username that is invalid'
            );

            assert.strictEqual(
                CommonRegExp.username.test('a'), false,
                'Expected RegExp to test false for username that is too short'
            );

            assert.strictEqual(
                CommonRegExp.username.test('a'.repeat(31)), false,
                'Expected RegExp to test false for username that is too long'
            );
        });

        it('has a correct password regex', () => {
            assert.strictEqual(
                CommonRegExp.password.test('Password1'), true,
                'Expected RegExp to test true for valid password.'
            );

            assert.strictEqual(
                CommonRegExp.password.test('Password1$£@%'), true,
                'Expected RegExp to test true for valid password (with special characters).'
            );

            assert.strictEqual(
                CommonRegExp.password.test('a'), false,
                'Expected RegExp to test false for password that is too short.'
            );

            assert.strictEqual(
                CommonRegExp.password.test('A1' + 'a'.repeat(254)), false,
                'Expected RegExp to test false for password that is too long.'
            );

            assert.strictEqual(
                CommonRegExp.password.test('abcdefg1'), false,
                'Expected RegExp to test false for password that has no capital letter.'
            );

            assert.strictEqual(
                CommonRegExp.password.test('abcdefgH'), false,
                'Expected RegExp to test false for password that has no numbers.'
            );

            assert.strictEqual(
                CommonRegExp.password.test('ABCDEFG1'), false,
                'Expected RegExp to test false for password that has no lowercase letter.'
            );

            assert.strictEqual(
                CommonRegExp.password.test('abcdefgh'), false,
                'Expected RegExp to test false for password that has only lowercase letters.'
            );

            assert.strictEqual(
                CommonRegExp.password.test('ABCDEFGH'), false,
                'Expected RegExp to test false for password that has only uppercase letters.'
            );
        });

    });

    describe('AutoMatcher', () => {

        // The AutoMatcher methods are dynamically generated based on the RegExp definitions, so it
        // stands to reason that if one (or at most two) of these Matcher methods work as intended,
        // they all will (provided, of course, that the regular expressions themselves are correct).

        describe('has at least two matchers working as expected', () => {

            it('matches a good email', () => {
                assert.strictEqual(Matcher.isEmail('me@example.com'), true);
            });

            it('does not match a bad email', () => {
                assert.strictEqual(Matcher.isEmail('not an email'), false);
            });

            it('matches a known good UUID', () => {
                assert.strictEqual(Matcher.isUUID('bc2f974a-526e-4f66-b75e-fd7a54204ef7'), true);
            });

            it('does not match a known bad UUID', () => {
                assert.strictEqual(Matcher.isUUID('not a UUID'), false);
            });

        });

    });

    describe('AutoAssert', () => {

        // The goal here is that AutoAssert should return the correct message
        // from CommonRegExpMessages for each assertion if there is an error,
        // or it should return null if the assertion passes.
        //
        // These scope of these tests is not concerned with the validity of the
        // matches themselves, which is itself tested previously.
        //
        // In other words, the only goal with selecting a value for these tests
        // is such that the selected value should be expected to yield the message
        // specified as the expected result in the test.
        //
        // Additionally, these tests should test the vague parameter is interpreted
        // and handled correctly.

        it('has correct results for email', () => {
            assert.strictEqual(Matcher.assertEmail('me@example.com'), null);
            assert.strictEqual(Matcher.assertEmail('me@example.com', { vagueErrors: false }), null);
            assert.strictEqual(Matcher.assertEmail('me@example.com', { vagueErrors: true }), null);

            assert.strictEqual(Matcher.assertEmail('not an email'), 'is not a valid e-mail address');
            assert.strictEqual(Matcher.assertEmail('not an email', { vagueErrors: false }), 'is not a valid e-mail address');
            assert.strictEqual(Matcher.assertEmail('not an email', { vagueErrors: true }), 'is not a valid e-mail address');

        });

        it('has correct results for UUID and UUIDv4', () => {
            assert.strictEqual(Matcher.assertUUID('497acc9e-07e0-4113-a830-553e7c2a9099'), null);
            assert.strictEqual(Matcher.assertUUID('497acc9e-07e0-4113-a830-553e7c2a9099', { vagueErrors: false }), null);
            assert.strictEqual(Matcher.assertUUID('497acc9e-07e0-4113-a830-553e7c2a9099', { vagueErrors: true }), null);
            assert.strictEqual(Matcher.assertUUID('not a UUID'), 'is not a valid ID');
            assert.strictEqual(Matcher.assertUUID('not a UUID', { vagueErrors: false }), 'is not a valid ID');
            assert.strictEqual(Matcher.assertUUID('not a UUID', { vagueErrors: true }), 'is not a valid ID');

            assert.strictEqual(Matcher.assertUUIDv4('497acc9e-07e0-4113-a830-553e7c2a9099'), null);
            assert.strictEqual(Matcher.assertUUIDv4('497acc9e-07e0-4113-a830-553e7c2a9099', { vagueErrors: false }), null);
            assert.strictEqual(Matcher.assertUUIDv4('497acc9e-07e0-4113-a830-553e7c2a9099', { vagueErrors: true }), null);
            assert.strictEqual(Matcher.assertUUIDv4('not a UUID'), 'is not a valid ID');
            assert.strictEqual(Matcher.assertUUIDv4('not a UUID', { vagueErrors: false }), 'is not a valid ID');
            assert.strictEqual(Matcher.assertUUIDv4('not a UUID', { vagueErrors: true }), 'is not a valid ID');
        });

        it('has correct results for username', () => {
            assert.strictEqual(Matcher.assertUsername('valid_username'), null);
            assert.strictEqual(Matcher.assertUsername('valid_username', { vagueErrors: false }), null);
            assert.strictEqual(Matcher.assertUsername('valid_username', { vagueErrors: true }), null);

            assert.strictEqual(Matcher.assertUsername('a'), 'is too short (must be at least 2 characters)');
            assert.strictEqual(Matcher.assertUsername('a', { vagueErrors: false }), 'is too short (must be at least 2 characters)');
            assert.strictEqual(Matcher.assertUsername('a', { vagueErrors: true }), 'is not a valid username');

            assert.strictEqual(Matcher.assertUsername('a'.repeat(31)), 'is too long (must be at most 30 characters)');
            assert.strictEqual(Matcher.assertUsername('a'.repeat(31), { vagueErrors: false }), 'is too long (must be at most 30 characters)');
            assert.strictEqual(Matcher.assertUsername('a'.repeat(31), { vagueErrors: true }), 'is not a valid username');

            assert.strictEqual(Matcher.assertUsername('$$$'), 'is not a valid username (may contain only letters, numbers, periods or underscores)');
            assert.strictEqual(Matcher.assertUsername('$$$', { vagueErrors: false }), 'is not a valid username (may contain only letters, numbers, periods or underscores)');
            assert.strictEqual(Matcher.assertUsername('$$$', { vagueErrors: true }), 'is not a valid username');
        });

        it('has correct results for password', () => {
            assert.strictEqual(Matcher.assertPassword('ValidPassword1'), null);
            assert.strictEqual(Matcher.assertPassword('ValidPassword1', { vagueErrors: false }), null);
            assert.strictEqual(Matcher.assertPassword('ValidPassword1', { vagueErrors: true }), null);

            assert.strictEqual(Matcher.assertPassword('a'), 'is too short (must be at least 8 characters)');
            assert.strictEqual(Matcher.assertPassword('a', { vagueErrors: false }), 'is too short (must be at least 8 characters)');
            assert.strictEqual(Matcher.assertPassword('a', { vagueErrors: true }), 'is not a valid password');

            assert.strictEqual(Matcher.assertPassword('a'.repeat(256)), 'is too long (must be at most 255 characters)');
            assert.strictEqual(Matcher.assertPassword('a'.repeat(256), { vagueErrors: false }), 'is too long (must be at most 255 characters)');
            assert.strictEqual(Matcher.assertPassword('a'.repeat(256), { vagueErrors: true }), 'is not a valid password');

            assert.strictEqual(Matcher.assertPassword('password'), 'is not a complex enough password (must contain at least one lowercase letter, one uppercase letter and one number)');
            assert.strictEqual(Matcher.assertPassword('password', { vagueErrors: false }), 'is not a complex enough password (must contain at least one lowercase letter, one uppercase letter and one number)');
            assert.strictEqual(Matcher.assertPassword('password', { vagueErrors: true }), 'is not a valid password');
        });

    });

});
