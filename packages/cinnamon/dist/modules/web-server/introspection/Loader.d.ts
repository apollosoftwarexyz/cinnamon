/**
 * If applied to a controller, the controller will only be loaded if the
 * specified {@link predicate} resolves to true. This is evaluated at
 * load time and not evaluated after that, unless the controllers are
 * reloaded (essentially never re-evaluated in production).
 *
 * @param predicate A(n) (async) function that must resolve to true, for
 * the controller to be loaded.
 *
 * @see LoadUnless
 */
export declare function LoadIf(predicate: () => boolean): (target: any) => void;
/**
 * A syntactic sugar for the inverse of the {@link LoadIf} annotation.
 *
 * @param predicate A(n) (async) function where, if it resolves to true, the
 * controller will not be loaded.
 *
 * @see LoadIf
 */
export declare function LoadUnless(predicate: () => boolean): (target: any) => void;
