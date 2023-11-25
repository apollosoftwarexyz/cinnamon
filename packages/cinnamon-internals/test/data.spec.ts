import { arrayEquals, setObjectDeep, arrayUnique, resolveObjectDeep, mergeObjectDeep } from '../src/index';
import * as assert from 'assert';

describe('Cinnamon Internals: Data Helpers', () => {

    describe('arrayUnique', () => {

        const uniqueArrayOf = (n: number) => Array.from(Array(n).keys());
        const identicalArrayOf = (n: number, v: any) => Array(n).fill(v);

        it('should return an array as-is with no duplicates', () => {
            assert.deepStrictEqual(arrayUnique([]), []);
            assert.deepStrictEqual(arrayUnique([], false), []);
            assert.deepStrictEqual(arrayUnique([], true), []);
            assert.deepStrictEqual(arrayUnique([1, 2, 3]), [1, 2, 3]);
            assert.deepStrictEqual(arrayUnique([1, 2, 3], false), [1, 2, 3]);
            assert.deepStrictEqual(arrayUnique([1, 2, 3], true), [1, 2, 3]);
            assert.deepStrictEqual(arrayUnique(uniqueArrayOf(29)), uniqueArrayOf(29));
            assert.deepStrictEqual(arrayUnique(uniqueArrayOf(29), false), uniqueArrayOf(29));
            assert.deepStrictEqual(arrayUnique(uniqueArrayOf(29), true), uniqueArrayOf(29));
            assert.deepStrictEqual(arrayUnique(uniqueArrayOf(30)), uniqueArrayOf(30));
            assert.deepStrictEqual(arrayUnique(uniqueArrayOf(30), false), uniqueArrayOf(30));
            assert.deepStrictEqual(arrayUnique(uniqueArrayOf(30), true), uniqueArrayOf(30));
        });

        it('should return an array with duplicates removed', () => {
            assert.deepStrictEqual(arrayUnique([1, 1]), [1]);
            assert.deepStrictEqual(arrayUnique([1, 1], false), [1]);
            assert.deepStrictEqual(arrayUnique([1, 1], true), [1]);
            assert.deepStrictEqual(arrayUnique([1, 2, 3, 3]), [1, 2, 3]);
            assert.deepStrictEqual(arrayUnique([1, 2, 3, 3], false), [1, 2, 3]);
            assert.deepStrictEqual(arrayUnique([1, 2, 3, 3], true), [1, 2, 3]);
            assert.deepStrictEqual(arrayUnique(identicalArrayOf(29, 1)), [1]);
            assert.deepStrictEqual(arrayUnique(identicalArrayOf(29, 1), false), [1]);
            assert.deepStrictEqual(arrayUnique(identicalArrayOf(29, 1), true), [1]);
            assert.deepStrictEqual(arrayUnique(identicalArrayOf(30, 1)), [1]);
            assert.deepStrictEqual(arrayUnique(identicalArrayOf(30, 1), false), [1]);
            assert.deepStrictEqual(arrayUnique(identicalArrayOf(30, 1), true), [1]);
        });

    });

    describe('arrayEquals', () => {

        it('should return false for values that are not arrays', () => {
            assert.equal(arrayEquals(null, null), false);
            assert.equal(arrayEquals(null, undefined), false);
            assert.equal(arrayEquals(undefined, null), false);
            assert.equal(arrayEquals(undefined, undefined), false);
            assert.equal(arrayEquals(undefined, []), false);
            assert.equal(arrayEquals([], undefined), false);
            assert.equal(arrayEquals(null, []), false);
            assert.equal(arrayEquals([], null), false);
            assert.equal(arrayEquals('' as any, '' as any), false);
            assert.equal(arrayEquals({} as any, {} as any), false);
        });

        it('should return true for two empty arrays', () => {
            assert.equal(arrayEquals([], []), true);
        });

        it('should return true for two identical arrays (regardless of ordering)', () => {
            assert.equal(arrayEquals([1, 2, 3], [1, 2, 3]), true);
            assert.equal(arrayEquals([2, 1, 3], [1, 2, 3]), true);
            assert.equal(arrayEquals([3, 1, 2], [1, 2, 3]), true);
            assert.equal(arrayEquals([3, 2, 1], [1, 2, 3]), true);
            assert.equal(arrayEquals(['a', 'b', 'c'], ['a', 'b', 'c']), true);
            assert.equal(arrayEquals(['c', 'b', 'a'], ['a', 'b', 'c']), true);
            assert.equal(arrayEquals([true, false], [true, false]), true);
            assert.equal(arrayEquals([false, true], [true, false]), true);
            assert.equal(arrayEquals([false, 'true'], ['true', false]), true);
        });

        it('should return false for two arrays with different lengths', () => {
            assert.equal(arrayEquals([1, 2, 3], [1, 2]), false);
            assert.equal(arrayEquals([1, 2], [1, 2, 3]), false);
            assert.equal(arrayEquals([1, 2, 3], [1, 2, 3, 4]), false);
            assert.equal(arrayEquals([1, 2, 3, 4], [1, 2, 3]), false);
            assert.equal(arrayEquals(['a', 'b', 'c'], ['a', 'b']), false);
        });

        it('should return false for two arrays with different values', () => {
            assert.equal(arrayEquals([1, 2, 3], [1, 2, 4]), false);
            assert.equal(arrayEquals([1, 2, 3], [1, 4, 3]), false);
            assert.equal(arrayEquals(['a', 'b', 'c'], ['a', 'b', 'd']), false);
        });

        it('should handle duplicate values correctly', () => {
            assert.equal(arrayEquals([1, 1, 2, 3], [1, 2, 3]), false);
            assert.equal(arrayEquals([1, 2, 3], [1, 1, 2, 3]), false);
            assert.equal(arrayEquals([1, 2, 3, 3], [1, 2, 3, 3]), true);
            assert.equal(arrayEquals(['a', 'b', 'c', 'c'], ['a', 'b', 'c', 'c']), true);
        });

    });

    describe('resolveObjectDeep', () => {

        const testObject = {
            a: {
                b: {
                    c: 'd'
                }
            },
            b: {
                d: 'c'
            }
        };

        it('should throw an error if the object is not an object or key is not a string', () => {
            assert.throws(() => resolveObjectDeep('a', undefined), TypeError);
            assert.throws(() => resolveObjectDeep('a', null), TypeError);
            assert.throws(() => resolveObjectDeep('a', 'foo' as any), TypeError);
            assert.throws(() => resolveObjectDeep(undefined, {}), TypeError);
        });

        it('should return undefined if the key does not exist', () => {
            assert.equal(resolveObjectDeep('', {}), undefined);
            assert.equal(resolveObjectDeep('', testObject), undefined);
            assert.equal(resolveObjectDeep('nonExistentKey', testObject), undefined);
            assert.equal(resolveObjectDeep('nonExistentKey.other.value', testObject), undefined);
            assert.equal(resolveObjectDeep('a.b.value', testObject), undefined);
        });

        it('should return the value if the key exists', () => {
            assert.equal(resolveObjectDeep('a', testObject), testObject.a);
            assert.equal(resolveObjectDeep('b', testObject), testObject.b);
        });

        it('should support nested keys', () => {
            assert.equal(resolveObjectDeep('a.b', testObject), testObject.a.b);
            assert.equal(resolveObjectDeep('a.b.c', testObject), testObject.a.b.c);
            assert.equal(resolveObjectDeep('a.b.c', testObject), 'd');
            assert.equal(resolveObjectDeep('b.d', testObject), testObject.b.d);
            assert.equal(resolveObjectDeep('b.d', testObject), 'c');
        });

    });

    describe('setObjectDeep', () => {

        const testObject = {
            a: {
                b: {
                    c: 'd'
                }
            },
            b: {
                d: 'c'
            },
            c: 'foo'
        };

        it('should throw an error if the object is not an object or key is not a string', () => {
            assert.throws(() => setObjectDeep('a', 'b', undefined), TypeError);
            assert.throws(() => setObjectDeep('a', 'b', null), TypeError);
            assert.throws(() => setObjectDeep('a', 'b', 'foo' as any), TypeError);
            assert.throws(() => setObjectDeep(undefined, 'b', {}), TypeError);
        });

        it('should throw an error if the key is nested, but a parent does not exist and createChildrenIfNeeded is false', () => {
            assert.throws(() => setObjectDeep('c', 'b', {}, { createChildrenIfNeeded: false }), Error);
            assert.throws(() => setObjectDeep('a.c', 'b', {}, { createChildrenIfNeeded: false }), Error);
            assert.throws(() => setObjectDeep('a.b.d', 'c', {}, { createChildrenIfNeeded: false }), Error);
        });

        it('should create the key if it is nested, a parent does not exist and createChildrenIfNeeded is true', () => {
            setObjectDeep('c', 'b', testObject, { createChildrenIfNeeded: true });
            assert.equal(testObject['c'], 'b');

            setObjectDeep('a.c', 'b', testObject, { createChildrenIfNeeded: true });
            assert.equal(testObject.a['c'], 'b');

            setObjectDeep('a.b.d', 'c', testObject, { createChildrenIfNeeded: true });
            assert.equal(testObject.a['b']['d'], 'c');
        });

        it('should set (overwrite) the value if the key exists', () => {
            setObjectDeep('a.b.c', 'e', testObject);
            assert.equal(testObject.a.b.c, 'e');

            setObjectDeep('a', 'b', testObject);
            assert.equal(testObject['a'], 'b');
        });

        it('should create child keys where the parent exists', () => {
            setObjectDeep('b.c', 'd', testObject);
            assert.equal(testObject.b['c'], 'd');

            setObjectDeep('b.c', { d: 'e' }, testObject);
            assert.equal(testObject.b['c']['d'], 'e');
        });

        it('should overwrite non-object values with an object if a descendent is created with overwriteParentIfNeeded', () => {
            setObjectDeep('b.d.c.e', 'hi', testObject);
            assert.deepEqual(testObject.b['d']['c'], { e: 'hi' });
            assert.equal(testObject.b['d']['c']['e'], 'hi');
        });

        it('should error with a suitable mesasge when overwriting non-object values with an object if a descendent is created without overwriteParentIfNeeded', () => {
            setObjectDeep('b.d', 'c', testObject);

            assert.throws(() => setObjectDeep('b.d.c.e.f.g.h', 'hi', testObject, { overwriteParentIfNeeded: false }), {
                name: 'ArgumentOrStateError',
                message: 'Failed to define key due to a conflict: "b.d.c.e.f.g.h".\n' +
                    '\n' +
                    "An ancestor/parent of the key is not an object and 'overwriteParentIfNeeded' is set to false so it was not modified.\n" +
                    'Specifically, "b.d" is "string" and not "object".\n' +
                    '\n' +
                    "- To overwrite any non-object ancestors with objects, set 'overwriteParentIfNeeded' to true.\n" +
                    '- Otherwise, double-check the key you are setting and that its parents are objects.\n\n'
            });

            assert.throws(() => setObjectDeep('b.d.c.e', 'hi', testObject, { overwriteParentIfNeeded: false }), {
                name: 'ArgumentOrStateError',
                message: 'Failed to define key due to a conflict: "b.d.c.e".\n' +
                    '\n' +
                    "An ancestor/parent of the key is not an object and 'overwriteParentIfNeeded' is set to false so it was not modified.\n" +
                    'Specifically, "b.d" is "string" and not "object".\n' +
                    '\n' +
                    "- To overwrite any non-object ancestors with objects, set 'overwriteParentIfNeeded' to true.\n" +
                    '- Otherwise, double-check the key you are setting and that its parents are objects.\n\n'
            });

            assert.throws(() => setObjectDeep('b.d.c', 'hi', testObject, { overwriteParentIfNeeded: false }), {
                name: 'ArgumentOrStateError',
                message: 'Failed to define key due to a conflict: "b.d.c".\n' +
                    '\n' +
                    "An ancestor/parent of the key is not an object and 'overwriteParentIfNeeded' is set to false so it was not modified.\n" +
                    'Specifically, "b.d" is "string" and not "object".\n' +
                    '\n' +
                    "- To overwrite any non-object ancestors with objects, set 'overwriteParentIfNeeded' to true.\n" +
                    '- Otherwise, double-check the key you are setting and that its parents are objects.\n\n'
            });

            assert.throws(() => setObjectDeep('c.d', 'hi', testObject, { overwriteParentIfNeeded: false }), {
                name: 'ArgumentOrStateError',
                message: 'Failed to define key due to a conflict: "c.d".\n' +
                    '\n' +
                    "An ancestor/parent of the key is not an object and 'overwriteParentIfNeeded' is set to false so it was not modified.\n" +
                    'Specifically, "c" is "string" and not "object".\n' +
                    '\n' +
                    "- To overwrite any non-object ancestors with objects, set 'overwriteParentIfNeeded' to true.\n" +
                    '- Otherwise, double-check the key you are setting and that its parents are objects.\n\n'
            });
        });

    });

    describe('mergeObjectDeep', () => {

        const testObject = () => ({
            a: {
                b: {
                    c: 'd'
                }
            },
            b: {
                d: 'c'
            },
            c: 'foo'
        });

        const testObject2 = () => ({
            a: {
                b: {
                    c: 'e'
                }
            },
            b: {
                d: 'c',
                f: {
                    g: 'h'
                }
            },
            c: 'foo'
        });

        it('should throw an error if the source or target is not an object (unless target is null)', () => {
            assert.throws(() => mergeObjectDeep(undefined, undefined), TypeError);
            assert.throws(() => mergeObjectDeep(null, undefined), TypeError);
            assert.throws(() => mergeObjectDeep(undefined, null), TypeError);
            assert.throws(() => mergeObjectDeep(null, null), TypeError);
            assert.throws(() => mergeObjectDeep({}, null), TypeError);
            assert.throws(() => mergeObjectDeep({}, undefined), TypeError);
            assert.throws(() => mergeObjectDeep('a', 'b'), TypeError);
            assert.throws(() => mergeObjectDeep('a', {}), TypeError);
            assert.throws(() => mergeObjectDeep(true, {}), TypeError);
        });

        it('should use the source object if the target is null and the source is non-null', () => {
            assert.deepEqual(mergeObjectDeep(undefined, {}), {});
            assert.deepEqual(mergeObjectDeep(null, {}), {});

            assert.deepEqual(mergeObjectDeep(null, {
                a: 'b'
            }), {
                a: 'b'
            });

            assert.deepEqual(mergeObjectDeep(testObject(), testObject()), testObject());
            assert.deepEqual(mergeObjectDeep(testObject2(), testObject2()), testObject2());
        });

        it('should merge the source object into the target object', () => {

            assert.deepEqual(mergeObjectDeep(testObject(), testObject2()), {
                a: {
                    b: {
                        c: 'e'
                    }
                },
                b: {
                    d: 'c',
                    f: {
                        g: 'h'
                    }
                },
                c: 'foo'
            });

            assert.deepEqual(mergeObjectDeep(testObject2(), testObject()), {
                a: {
                    b: {
                        c: 'd'
                    }
                },
                b: {
                    d: 'c',
                    f: {
                        g: 'h'
                    }
                },
                c: 'foo'
            });

        });

    });

});
