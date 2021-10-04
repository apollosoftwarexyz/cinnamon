import { Method } from "./Method";
import Loader, {activeLoader, LOADER_ROOT_ROUTE_NAMESPACE} from "../loader";

// import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
const uuid = require('uuid');
const uuidv4 = uuid.v4;
const uuidv5 = uuid.v5;

/**
 * Registers a class method as an API route.
 *
 * @param method The HTTP method that the client must use to call this method.
 * @param path The path that the client must use to call this method.
 */
export default function Route(method: Method, path: string) {
    return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {

        // Ensure target class has a unique ID.
        if (!target.constructor._loaderId) {
            target.constructor._loaderId = uuidv4();
        }

        // Gather class data.
        const functionName: string = propertyKey;
        const handler = descriptor?.value;
        if (handler == null) return;

        // Generate unique route ID.
        const controller = uuidv5(target.constructor._loaderId, LOADER_ROOT_ROUTE_NAMESPACE);
        const identifier = uuidv5(functionName, controller);

        if (activeLoader) {
            Loader.loadRoute({
                identifier,
                controller,
                method,
                path,
                handler,
                middleware: []
            });
        } else throw new Error("Failed to identify the active loader.");

    }
}
