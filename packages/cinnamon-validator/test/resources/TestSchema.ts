import { createValidator, Validate, ValidatorSchema } from "@apollosoftwarexyz/cinnamon-validator";

export class Address extends ValidatorSchema<Address> {

    @Validate({ required: true })
    street: string;

}

export class User extends ValidatorSchema<User> {

    @Validate<string>({ minLength: 3 }, 'must be at least 3 characters')
    username: string;

    @Validate<Address>({ required: true })
    address: Address;

}

function test() {

    const myValidator = createValidator(User.prototype);

    const user = myValidator.validate({});
    console.log(user.username);

}
