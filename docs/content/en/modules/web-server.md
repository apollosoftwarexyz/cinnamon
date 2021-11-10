---
title: Web Server
description: "Cinnamon Web Server module."
position: 14
category: Modules
---

<div class="page-description">
The Web Server module allows you to easily create API request handlers, 
called <em>routes</em>, which are organized into groups of routes called
<em>controllers</em>.
</div>

Cinnamon's Web Server module is powered by [koa.js](https://koajs.com) and
[@koa/router](https://github.com/koajs/router), which provides an API
foundation over [Node's HTTP module](https://nodejs.org/api/http.html) with
routing services that Cinnamon, in turn, builds upon to provide a concise and
intuitive, yet powerful API for building HTTP REST API Controllers – the latter
component of the MVC (Model-View-Controller) software architecture.

Additionally, [chokidar](https://www.npmjs.com/package/chokidar) is used to
watch for changes, allowing us to provide hot-reload services for
[Controllers](#controllers) whilst in development.

## Controllers
Controllers are simply a group of routes with a common prefix that can be 
loaded (or, if desired, conditionally loaded) together.

> How you organize your routes into controllers is largely left to your 
> discretion however one popular method, we commonly use internally, is to
> combine all methods for a given entity into a controller named after that
> entity.
> 
> For example, a `Book` entity might have a `BookController` with create, 
> read, update and delete (CRUD) methods for books. This controller might 
> then name its routes accordingly (`/book/create`, `/book/:id`, etc.), 
> where the controller's prefix is `/book`.

Controllers are automatically loaded from the configured controllers directory
(by default, `/src/controllers`). Each controller file should `export default`
a class decorated with Cinnamon's `@Controller()`, optionally with a specified
path prefix.

There are no enforced naming constraints on controllers, other than those 
enforced by JavaScript/TypeScript – you can even have multiple controllers 
sharing the same name.

Controller loading is done recursively so, again, the organization of the 
directories is left up to your discretion, but we recommend creating 
directories for the path prefixes defined in your controller up until the 
controller's name itself. For example, the controller holding the route 
`/v1/example/myExample`, might be `ExampleController`, it would define the 
route prefix `/v1/example` at the controller-level and thus, the file would 
be located at `/v1/ExampleController.ts`.

```ts[src/controllers/v1/ExampleController.ts]
import { Controller } from '@apollosoftwarexyz/cinnamon';

@Controller('v1', 'example')
export default class ExampleController {
    // ...
}
```

### The `@Controller` decorator
The `@Controller` decorator is fairly trivial to use. You simply decorate your
Controller class with the `@Controller` decorator, passing in the route prefix
as either one parameter representing the entire prefix, or as multiple 
parameters representing components of the final prefix.

Leading and trailing slashes in the prefix are automatically trimmed and then 
re-added once the prefix is combined, so `/v1`, `/example` and `/v1`, 
`example`, would both yield `/v1/example` as the final route, for example.

> A benefit to this approach is that it gives you the flexibility to use
> variables in your routing prefixes. For instance, you could define a 
> variable as a global prefix applied to all controllers and simply include 
> it in the decorator.

## Routes
Routes are the key building blocks defined on controllers to accept and handle
requests. Each route represents a different type of request (HTTP method and 
path) that the server might receive and is simply a function called by 
Cinnamon's web server module with the request context to process the request.

Under the hood, requests are handled by [koa.js](https://koajs.com). This 
means koa's request context is the `ctx: Context` parameter passed into each
request handler. (The `Context` type is re-exported by the framework for 
future-proofing and to provide a layer of abstraction with the underlying 
application engine.)

Each route is simply loaded as a part of its parent Controller class, when 
the parent class is loaded. Simply define each route as a named `async function`
on your controller.

```ts[src/controllers/v1/ExampleController.ts]
import { Context, Controller, Method, Route } from '@apollosoftwarexyz/cinnamon';

@Controller('v1', 'example')
export default class ExampleController {
    
    @Route(Method.GET, '/')
    public async index(ctx: Context): Promise<void> {
        ctx.body = "Hello, world!";
    }
    
}
```

There are no enforced naming constraints on routes, other than those
enforced by JavaScript/TypeScript – which naturally means two routes in the 
same controller cannot share the same name, even if they share the same path.

### The `@Route` decorator
The `@Route` decorator is also fairly trivial to use. Simply decorate each 
route (request handler) with the `@Route` decorator. It takes only two
parameters; the first being the HTTP method that should be used to access 
the route (a member of Cinnamon's `Method` enum, for example `Method.GET` for 
HTTP `GET` requests), and the second being the path for the route.

The path can include parameters as well by prefixing the parameter with a 
colon (e.g., `/user/:id`), where `:id` is a parameter, `id`. You may also 
use any other path feature provided by
[`@koa/router`](https://www.npmjs.com/package/koa-router) as that, too, is used
under the hood to provide routing services for the controllers. The route
parameters can then be accessed from `ctx.params`.

```ts[src/controllers/v1/ExampleController.ts]
import { Context, Controller, Method, Route } from '@apollosoftwarexyz/cinnamon';

@Controller('v1', 'example')
export default class ExampleController {
    
    @Route(Method.GET, '/:myParam')
    public async index(ctx: Context): Promise<void> {
        ctx.body = `Parameter: ${ctx.params.myParam}`;
    }
    
}
```

## Middleware
Middleware are just functions that receive a `ctx: Context` (the request 
context from koa) and a `next: Next` (the 'next' function to execute which 
may be optionally called by the middleware to execute the handler that would 
be executed after the current middleware.)

<img src="/images/Middleware-light.png" class="light-img" alt="Middleware diagram" role="presentation" />
<img src="/images/Middleware-dark.png" class="dark-img" alt="Middleware diagram" role="presentation" />

There is no pre-defined location for middleware, however we recommend (a fairly
appropriately named) `/src/middlewares` directory. Simply export your
middleware as an `async function` with the aforementioned `ctx` and `next`
parameters.

```ts[src/middlewares/ExampleMiddleware.ts]
import { Context, Next } from '@apollosoftwarexyz/cinnamon';

export async function ExampleMiddleware(ctx: Context, next: Next): Promise<any> {

    if (ctx.request.query['token'] !== 'example') {
        // Set HTTP response code to 400 (Bad Request)
        ctx.status = 400;
        // Set the response body.
        ctx.body = "You must set ?token=example";
        // Return early, so next() isn't called.
        return;
    }
    
    // If we got to this point, we obviously didn't return early,
    // so let's call the next() function to pass off to the route
    // (request handler) or the next middleware.
    return next();
    
    // The return value is ignored, but we consider returning the
    // value of the next function a good practice for control flow.

}
```

### The `@Middleware` decorator
To apply a middleware to your route, you use the `@Middleware` decorator. This
is a trivial decorator; the only parameter to the decorator is the middleware
function you wish to apply.

<alert type="warning">

You **must** apply the `@Middleware` decorator **above** a `@Controller` or
`@Route` decorator. Applying them in the reverse order will cause an error.

<br>

The reason for this, is that (perhaps counter-intuitively) decorators in
TypeScript are executed bottom to top, which means you must apply the
`@Middleware` decorator above `@Controller` or `@Route` so the Controller or
Route (respectively) is initialized (executed first) before you try to apply
the middleware to it.

</alert>

```ts[src/controllers/v1/ExampleController.ts]
import { Context, Controller, Method, Middleware, Route } from '@apollosoftwarexyz/cinnamon';

// Importing the middleware from the previous example.
import { ExampleMiddleware } from '../middlewares/ExampleMiddleware.ts';

@Controller('v1', 'example')
export default class ExampleController {
    
    @Middleware(ExampleMiddleware)
    @Route(Method.GET, '/')
    public async index(ctx: Context): Promise<void> {
        ctx.body = `Hello, world!`;
    }
    
}
```

## Example
A basic example of a project utilizing Cinnamon's Web Server module is the
`basic-webserver` project included in Cinnamon's repository:

https://github.com/apollosoftwarexyz/cinnamon/tree/master/examples/basic-webserver

## Troubleshooting
- **If your controller or middleware files aren't being loaded correctly, at
  all, or are throwing an error on load**, be sure you're importing `.ts`
  (TypeScript) files.
  Using JavaScript files with Cinnamon is undefined behavior, is unsupported
  and is unlikely to work at all. You should write TypeScript and execute
  TypeScript in runtime during development and in production with `ts-node`.
  
  There is no performance penalty for doing this (save for a few extra seconds
  of load time) and this allows for performing runtime type checking and safer
  type introspection as well as reducing errors introduced during the
  TypeScript-to-JavaScript transpilation/compilation process.

- **If your route unexpectedly returns 404 (Not Found)**, make sure your route
  is defined with the correct method and path. **Additionally, make sure you
  are setting a response body** in your routes and middlewares and/or correctly
  calling `next()` in any middlewares, such that a response body is set for any
  given code path.
  
  If your routes or middlewares exit or end without setting a response body,
  koa will explicitly return a 404 rather than leaving the browser to timeout
  unexpectedly. If this isn't what you want, be sure to set a response body in
  the code paths where you expect a response. **Or, alternatively,** if you
  don't want to return a response body, you can just explicitly set the HTTP
  status code.
