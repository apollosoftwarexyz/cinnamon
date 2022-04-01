"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ValidationResult {
    constructor(options) {
        this.success = options.success;
        this.message = options.message;
    }
    static success() {
        return new ValidationResult({
            success: true
        });
    }
    static fail(message) {
        return new ValidationResult({
            success: false,
            message
        });
    }
}
exports.default = ValidationResult;
