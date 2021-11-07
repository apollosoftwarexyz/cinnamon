---
badge: Beta
title: Validator
description: "Cinnamon Validator module."
position: 13
category: Modules
---

<div class="page-description">
The Validator module allows you to easily and quickly perform data validation
on JavaScript/JSON objects, such as request bodies.
</div>

<alert type="warning">

This module is currently in **beta**. Its API may evolve over time and/or
change in the future. If you use this module, in its current state, you should
be prepared to update your code to accommodate these changes when you update
your Cinnamon version.

</alert>

The validator module is useful for performing data validation against a
known 'schema'. A schema is an object defining a set of rules such that any
object validating against it, must comply with to be considered valid.

Cinnamon's validator module is specifically designed to give human-readable,
user-friendly error messages if validation against the schema fails, meaning
unless you need to provide a more specific or detailed message to the user, you
can likely just use the validation message directly.

We expect that the most common usage of this module will be to validate request
bodies in routes that accept one.

## Performing Validation

To perform validation, you must first create a `Validator` – an object that
holds a validation schema and can be re-used to validate any object against
that schema. You can do so with the `createValidator` function from Cinnamon
(or you can use its alias; `$`).

```ts
import { createValidator, ValidationResult } from "@apollosoftwarexyz/cinnamon";

/**
 * Performs validation against any object expected to have a
 * 'name' parameter.
 */
const namedObjectValidator = createValidator({
    name: {
        type: "string",
        required: true,
        minLength: 2,
        maxLength: 32,
    }
});

const result1: ValidationResult = namedObjectValidator.validate({
    name: "Bob Smith",
    age: 32
})[0];
console.log(`Will equal true: ${result1.success}`);

const result2: ValidationResult = namedObjectValidator.validate({
    age: 33
})[0];
console.log(`Will equal false: ${result2.success}`);
console.log(`  Message: ${result2.message}`);
```

Calling `validate` on a Validator returns an array of values.

As shown, the first array index is the `ValidationResult`. This holds a
`success: boolean` value (whether validation was successful, or not) and,
optionally, a `message: string` value – a message explaining why validation
failed, naturally only set when `success` is `false`.

The second array index is set (only if the validation succeeded) to the object
that was passed into the validator. This can be useful for immediate
destructuring or null-checking.

## Expected Changes
The following are changes expected to be made to the API before this module is
no longer considered 'in beta' and will be considered 'API stable'.

### Route Middleware
There are plans to write a validator middleware for checking request bodies
against a given schema, at which point this will become the preferred method
for validation of response bodies.

This will be updated as more detailed plans/information become available.

### `validate()` result
The return value of the `validate()` function is in question. The fact that it
encourages destructuring is ideal for flat (non-nested) objects, however it
will cause an error if a nested object is `null` or `undefined`, yet expected
in the schema, which introduces uncertainty and inconsistencies in how that API
is expected to be and should be used.

Use of `try-catch` can make control flow messy, so we've tried to avoid use of
it when designing the validation API, however given a validator is often used
in security contexts, perhaps it might be preferential to encourage use of
`try-catch`.

Additionally, using an array with numerical indexes is considered, at least to
a degree, ambiguous and somewhat nonsensical for discrete values, and it is not
at all clear intuitively how this should work.

Further experimentation and thought needs to be put into the return value of
the `validate()` function.

## Example
A basic example of Cinnamon's Validator module is the `validation` project
included in Cinnamon's repository:

https://github.com/apollosoftwarexyz/cinnamon/tree/master/examples/validation

## Troubleshooting
- **If you get a TypeError caused by a nested object being null in a request
  body, and you are destructuring the body parameters**, you need to avoid
  destructuring the nested objects before returning from your function due to
  the validation error, as destructuring a nested object will fail if that 
  object is `null`.
