import { v5 as uuidv5 } from 'uuid';
import Loader, { activeLoader, LOADER_ROOT_ROUTE_NAMESPACE } from '../loader';
import { Context } from '../../../index';
import { Next } from 'koa';

export type MiddlewareFn = (context: Context, next: Next) => Promise<void>;

/**
 * Registers a middleware function for an API route.
 * @param fn The middleware function that should be executed for the route.
 */
export default function Middleware(fn: MiddlewareFn) {
    return function (target: any, propertyKey: string) {

        if (!activeLoader) throw new Error('Failed to identify the active loader.');

        // Gather class data.
        const classIdentifier = target.constructor._loaderId;
        const methodIdentifier: string = propertyKey;

        if (!classIdentifier || !methodIdentifier) {
            activeLoader.framework.logger.warn(`Attempted to register middleware on invalid route.`);
            return;
        }

        const classNamespace = uuidv5(classIdentifier, LOADER_ROOT_ROUTE_NAMESPACE);
        const identifier = uuidv5(methodIdentifier, classNamespace);

        Loader.loadMiddleware(identifier, fn);

    };
}
