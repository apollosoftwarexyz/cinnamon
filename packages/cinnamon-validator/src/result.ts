export default class ValidationResult {

    public readonly success: boolean;
    public readonly message?: string;

    constructor(options: {
        success: boolean,
        message?: string
    }) {
        this.success = options.success;
        this.message = options.message;
    }

    static success() {
        return new ValidationResult({
            success: true
        });
    }

    static fail(message?: string) {
        return new ValidationResult({
            success: false,
            message
        });
    }

}
