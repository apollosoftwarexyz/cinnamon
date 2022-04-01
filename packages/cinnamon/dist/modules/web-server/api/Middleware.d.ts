export declare type MiddlewareFn = Function;
/**
 * Registers a middleware function for an API route.
 * @param fn The middleware function that should be executed for the route.
 */
export default function Middleware(fn: MiddlewareFn): (target: any, propertyKey: string) => void;
