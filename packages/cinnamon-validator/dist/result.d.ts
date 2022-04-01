export default class ValidationResult {
    readonly success: boolean;
    readonly message?: string;
    constructor(options: {
        success: boolean;
        message?: string;
    });
    static success(): ValidationResult;
    static fail(message?: string): ValidationResult;
}
