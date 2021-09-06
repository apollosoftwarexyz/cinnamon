import { $ } from '@apollosoftwarexyz/cinnamon';

(async () => {

    const userRequest = $({
        username: {
            type: "string",
            required: true,
            minLength: 2,
            maxLength: 32,
        },
        password: {
            type: "string",
            required: true,
            minLength: 8,
            maxLength: 128,
            matches: {
                // Ensure the password has all of the following:
                // - lowercase letter
                // - uppercase letter
                // - number
                // - character that is non of the above (i.e., symbol)
                $all: [ /[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/ ]
            },
        },
        confirmPassword: {
            type: "string",
            required: true,
            $eq: "password"
        },
        birthYear: {
            type: "number",
            integer: true,
            min: 1900,
            max: (new Date().getFullYear() - 2001)
        }
    });

})();
