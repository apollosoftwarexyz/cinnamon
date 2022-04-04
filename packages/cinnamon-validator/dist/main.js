"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationResult = exports.Validator = exports.$ = exports.createValidator = void 0;
const executor_1 = require("./executor");
Object.defineProperty(exports, "Validator", { enumerable: true, get: function () { return executor_1.Validator; } });
/**
 * An alias to create a validator from the specified schema.
 * (Put simply, a validator handles performing validation on objects according to the specified validation schema.)
 *
 * This method is also exported as '$' to allow for convenient access to the validator.
 *
 * @param schema The schema to perform validation of values against.
 */
function createValidator(schema) {
    return new executor_1.Validator(schema);
}
exports.createValidator = createValidator;
exports.$ = createValidator;
const result_1 = require("./result");
exports.ValidationResult = result_1.default;
