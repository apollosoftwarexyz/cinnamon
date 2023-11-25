import {
    parseHumanReadableBytes,
    toLowerCaseVariant,
    toLowerKebabCase,
    toLowerSnakeCase,
    toUpperCamelCase
} from '../src/index';
import * as assert from 'assert';

describe('Cinnamon Internals: Format Helpers', () => {

    describe('parseHumanReadableBytes', () => {

        it('should parse bytes strings', () => {
            function parseMultiple(multiple: number) {
                assert.equal(parseHumanReadableBytes(`${multiple}b`), multiple);
                assert.equal(parseHumanReadableBytes(`${multiple}B`), multiple);
                assert.equal(parseHumanReadableBytes(`${multiple} b`), multiple);
                assert.equal(parseHumanReadableBytes(`${multiple} B`), multiple);

                assert.equal(parseHumanReadableBytes(`${multiple}kb`), multiple * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}Kb`), multiple * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}kB`), multiple * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}KB`), multiple * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} kb`), multiple * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} Kb`), multiple * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} kB`), multiple * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} KB`), multiple * 1024);

                assert.equal(parseHumanReadableBytes(`${multiple}mb`), multiple * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}Mb`), multiple * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}mB`), multiple * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}MB`), multiple * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} mb`), multiple * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} Mb`), multiple * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} mB`), multiple * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} MB`), multiple * 1024 * 1024);

                assert.equal(parseHumanReadableBytes(`${multiple}gb`), multiple * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}Gb`), multiple * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}gB`), multiple * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}GB`), multiple * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} gb`), multiple * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} Gb`), multiple * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} gB`), multiple * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} GB`), multiple * 1024 * 1024 * 1024);

                assert.equal(parseHumanReadableBytes(`${multiple}tb`), multiple * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}Tb`), multiple * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}tB`), multiple * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}TB`), multiple * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} tb`), multiple * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} Tb`), multiple * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} tB`), multiple * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} TB`), multiple * 1024 * 1024 * 1024 * 1024);

                assert.equal(parseHumanReadableBytes(`${multiple}pb`), multiple * 1024 * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}Pb`), multiple * 1024 * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}pB`), multiple * 1024 * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple}PB`), multiple * 1024 * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} pb`), multiple * 1024 * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} Pb`), multiple * 1024 * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} pB`), multiple * 1024 * 1024 * 1024 * 1024 * 1024);
                assert.equal(parseHumanReadableBytes(`${multiple} PB`), multiple * 1024 * 1024 * 1024 * 1024 * 1024);
            }

            parseMultiple(1);
            parseMultiple(10);
            parseMultiple(13);
            parseMultiple(16);
            parseMultiple(52);
        });

    });

    describe('toLowerCaseVariant (and aliases)', () => {

        it('should convert to lower_snake_case by default', () => {
            assert.equal(toLowerCaseVariant('HelloWorld'), 'hello_world');
            assert.equal(toLowerCaseVariant('HelloWorld123'), 'hello_world_123');
            assert.equal(toLowerCaseVariant('Hello123World'), 'hello_123_world');
            assert.equal(toLowerCaseVariant('Hello123World123'), 'hello_123_world_123');

            assert.equal(toLowerSnakeCase('HelloWorld'), 'hello_world');
            assert.equal(toLowerSnakeCase('HelloWorld123'), 'hello_world_123');
            assert.equal(toLowerSnakeCase('Hello123World'), 'hello_123_world');
            assert.equal(toLowerSnakeCase('Hello123World123'), 'hello_123_world_123');

            assert.equal(toLowerCaseVariant('HelloWorld', '-'), 'hello-world');
            assert.equal(toLowerCaseVariant('HelloWorld123', '-'), 'hello-world-123');
            assert.equal(toLowerCaseVariant('Hello123World', '-'), 'hello-123-world');
            assert.equal(toLowerCaseVariant('Hello123World123', '-'), 'hello-123-world-123');

            assert.equal(toLowerKebabCase('HelloWorld'), 'hello-world');
            assert.equal(toLowerKebabCase('HelloWorld123'), 'hello-world-123');
            assert.equal(toLowerKebabCase('Hello123World'), 'hello-123-world');
            assert.equal(toLowerKebabCase('Hello123World123'), 'hello-123-world-123');
        });

        it('should work with the empty string, null, or undefined', () => {
            assert.equal(toLowerCaseVariant(''), '');
            assert.equal(toLowerCaseVariant(null), null);
            assert.equal(toLowerCaseVariant(undefined), undefined);

            assert.equal(toLowerSnakeCase(''), '');
            assert.equal(toLowerSnakeCase(null), null);
            assert.equal(toLowerSnakeCase(undefined), undefined);

            assert.equal(toLowerKebabCase(''), '');
            assert.equal(toLowerKebabCase(null), null);
            assert.equal(toLowerKebabCase(undefined), undefined);
        });

        it('should ignore illegal characters', () => {
            assert.equal(toLowerCaseVariant('$$$'), '');
            assert.equal(toLowerCaseVariant('Hello-World'), 'hello_world');
            assert.equal(toLowerCaseVariant('%Hello-World'), 'hello_world');
            assert.equal(toLowerCaseVariant('Hello World'), 'hello_world');
            assert.equal(toLowerCaseVariant('$Hello World'), 'hello_world');
            assert.equal(toLowerCaseVariant('Hello world'), 'hello_world');
            assert.equal(toLowerCaseVariant('hello world'), 'hello_world');
            assert.equal(toLowerCaseVariant('hello--world'), 'hello_world');
            assert.equal(toLowerCaseVariant('hello£world'), 'hello_world');
            assert.equal(toLowerCaseVariant('hello$world'), 'hello_world');
            assert.equal(toLowerCaseVariant('hello$world$'), 'hello_world_');
            assert.equal(toLowerCaseVariant('hello$world$$'), 'hello_world_');
            assert.equal(toLowerCaseVariant('hello$world$%'), 'hello_world_');
            assert.equal(toLowerCaseVariant('$hello$world$%'), 'hello_world_');
        });

    });

    describe('toUpperCamelCase', () => {

        it('should convert to UpperCamelCase', () => {
            assert.equal(toUpperCamelCase('hello_world'), 'HelloWorld');
            assert.equal(toUpperCamelCase('hello_world123'), 'HelloWorld123');
            assert.equal(toUpperCamelCase('hello_world_123'), 'HelloWorld123');
            assert.equal(toUpperCamelCase('hello-world'), 'HelloWorld');
            assert.equal(toUpperCamelCase('hello-world123'), 'HelloWorld123');
            assert.equal(toUpperCamelCase('hello-world-123'), 'HelloWorld123');
            assert.equal(toUpperCamelCase('hello-123-world'), 'Hello123World');
            assert.equal(toUpperCamelCase('hello-123-world-123'), 'Hello123World123');
        });

        it('should work with the empty string, null, or undefined', () => {
            assert.equal(toUpperCamelCase(''), '');
            assert.equal(toUpperCamelCase(null), null);
            assert.equal(toUpperCamelCase(undefined), undefined);
        });

        it('should ignore illegal characters', () => {
            assert.equal(toUpperCamelCase('$$$'), '');
            assert.equal(toUpperCamelCase('Hello-World'), 'HelloWorld');
            assert.equal(toUpperCamelCase('Hello World'), 'HelloWorld');
            assert.equal(toUpperCamelCase('Hello world'), 'HelloWorld');
            assert.equal(toUpperCamelCase('hello world'), 'HelloWorld');
            assert.equal(toUpperCamelCase('hello--world'), 'HelloWorld');
            assert.equal(toUpperCamelCase('hello£world'), 'HelloWorld');
            assert.equal(toUpperCamelCase('hello£World'), 'HelloWorld');
            assert.equal(toUpperCamelCase('Hello£world'), 'HelloWorld');
            assert.equal(toUpperCamelCase('Hello£World'), 'HelloWorld');
            assert.equal(toUpperCamelCase('hello$world'), 'HelloWorld');
            assert.equal(toUpperCamelCase('hello$world$'), 'HelloWorld');
            assert.equal(toUpperCamelCase('hello$world$$'), 'HelloWorld');
            assert.equal(toUpperCamelCase('hello$world$%'), 'HelloWorld');
        });

    });

});
