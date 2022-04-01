"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Method = void 0;
var Method;
(function (Method) {
    /**
     * The GET method requests a representation of a given resource.
     * Requests using GET should only retrieve data.
     *
     * Recommended for READ of CRUD.
     */
    Method["GET"] = "GET";
    /**
     * The HEAD method requests a resource identical to that of a GET
     * request but without the response body.
     *
     * Recommended for implementing things like connectivity checks,
     * see also: TRACE.
     */
    Method["HEAD"] = "HEAD";
    /**
     * The TRACE method performs a loop-back test along the path to the
     * target resource. This can be used as a debugging mechanism.
     */
    Method["TRACE"] = "TRACE";
    /**
     * The POST method is used to submit an entity to a given resource.
     * This will often cause a change of state of side-effects on the
     * server.
     *
     * Recommended for CREATE of CRUD.
     */
    Method["POST"] = "POST";
    /**
     * The PUT method replaces all current representations of the specified
     * resource with the request payload.
     *
     * Recommended for the UPDATE of CRUD.
     */
    Method["PUT"] = "PUT";
    /**
     * The DELETE method deletes the specified resource.
     *
     * Recommended for the DELETE of CRUD.
     */
    Method["DELETE"] = "DELETE";
    /**
     * The OPTIONS method is used to describe the communication options
     * for the target resource. This is used by browsers to determine
     * what headers can be sent to 'writable' API methods such as POST
     * methods, for example.
     */
    Method["OPTIONS"] = "OPTIONS";
    /**
     * The PATCH method is used to apply partial modifications to
     * a resource.
     *
     * Recommended for more finely grained control of the UPDATE
     * of CRUD.
     */
    Method["PATCH"] = "PATCH";
})(Method = exports.Method || (exports.Method = {}));
