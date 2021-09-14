"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationSchemaExecutor = exports.$ = exports.createValidationSchemaExecutor = void 0;
const executor_1 = require("./executor");
Object.defineProperty(exports, "ValidationSchemaExecutor", { enumerable: true, get: function () { return executor_1.ValidationSchemaExecutor; } });
/**
 * An alias to create a Validation Schema Executor from the specified schema.
 * (Put simply, a Validation Schema Executor handles performing validation on objects according to the specified
 * schema.)
 *
 * @param schema The schema to perform validation of values against.
 */
function createValidationSchemaExecutor(schema) {
    return new executor_1.ValidationSchemaExecutor(schema);
}
exports.createValidationSchemaExecutor = createValidationSchemaExecutor;
exports.$ = createValidationSchemaExecutor;
