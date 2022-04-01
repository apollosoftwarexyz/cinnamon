import { Method } from "./Method";
/**
 * Registers a class method as an API route.
 *
 * @param method The HTTP method that the client must use to call this method.
 * @param path The path that the client must use to call this method.
 */
export default function Route(method: Method, path: string): (target: any, propertyKey: string, descriptor?: PropertyDescriptor | undefined) => void;
