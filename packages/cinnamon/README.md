<h1 align="center">Cinnamon</h1>
<p align="center">
    Built with ❤︎ by <a href="https://apollosoftware.xyz/">Apollo Software Limited</a>
</p>

<br>

<p align="center">
<b>Cinnamon is our opinionated Enterprise TypeScript framework for building API services.</b>
<br>
📚 <b>Learn more on our documentation site: https://docs.apollosoftware.xyz/cinnamon</b> 📚
</p>

<br>

<p align="center"><i>"The line of code that's the fastest to write, that never breaks, that doesn't need maintenance, is the line you never had to write."</i></p>

<br>
<hr>

**(β) Cinnamon is currently in beta!** We are actively working on the framework
and welcome feedback and contributions!
Please feel free to open issues and pull requests on this repository.

For information about the current status of the project, please see the
[VERSIONS](VERSIONS.md) file.

<hr>
<br><br>

The key design principle of Cinnamon is to encourage use of best practices
and patterns in a way that is natural, intuitive, and reliable. Its declarative
programming style aims to reduce the amount of boilerplate code required to
build a project. Collectively, these allow teams to focus their valuable time
on building their product and user-experience and not on mundane boilerplate
code.

- Actively used and maintained by Apollo Software Limited on projects large and
  small.
- Builds on and incorporates many years of experience building API services.
- Get exactly what you need for your project with Cinnamon's modular design.
- Built to be highly dependable and reliable. Use projects built years ago as
  though they were born yesterday.
- We audit and review all dependencies to ensure they are secure, reliable and
  well-maintained. We also actively monitor for security vulnerabilities and 
  update dependencies as soon as possible. See our [security policy](SECURITY.md).

**Convinced?** Have a project ready to go in seconds with
  [`create-cinnamon-project`](#getting-started).

<br>

```typescript
import { Controller, Route, Method, Context } from '@apollosoftwarexyz/cinnamon';
import { MaybeAuthenticated } from '../middlewares/Authentication';

@Controller('api', 'v1')
export default class IndexController {

    /**
     * Greets the user.
     * If they are authenticated, they will be greeted by name.
     */
    @Middleware(MaybeAuthenticated)
    @Route(Method.GET, '/')
    public async index(ctx: Context) {
        return {
            body: `Hello, ${ctx.user?.smartName ?? 'Guest'}!`
        };
    }

}
```

<sup>↑ A controller from the template project created with <a href="#getting-started">`create-cinnamon-project`</a> with the <b>Database</b> and <b>Authentication</b> features selected.</sup>

<br>

## Getting Started
Simply run the following command to set up a new Cinnamon project:

```bash
$ yarn create cinnamon-project my-project
```

This will create a new Cinnamon project in the `my-project` directory, prompt
you to select features that will be automatically added, and provide
instructions on how to run the project.

Then, check out our [documentation](https://docs.apollosoftware.xyz/cinnamon)
to learn more about how to use Cinnamon!

<br>

## Features
- [x] Configurable with `cinnamon.toml`
- [x] Logger module (extensive logging for your application)
    - [x] Logger delegate support (handle log events - e.g., for logging remotely)
- [x] Web Server module (for backend API service controllers) using [Koa](https://github.com/koajs)
    - [x] Hot reload for API service controllers
    - [x] Middleware and Routing support
    - [x] Static file hosting support
- [x] Database ORM module using [Mikro-ORM](https://mikro-orm.io)
- [x] Validation module (for data validation on JavaScript/JSON objects)
    - [x] Middleware for Web Server module
- [x] Session Management and Authentication module
- [x] CLI tooling and utilities
    - [ ] CLI helpers for production and development tasks
    - [ ] Support for shell script generation
- [ ] Additional hot reload
  - [ ] Allow specifying directories with reload 'type' (`restart`, `only-config`, `only-controllers`) on change.
  - [ ] Hot-reload `cinnamon.toml` by default.

<br>

## Development
1. Cinnamon uses [Yarn Berry (4.x)](https://yarnpkg.com/getting-started/install)'s built-in workspace management. If necessary, you should install it with `yarn set version stable`:
    ```bash
    # To update the local version:
    cd /path/to/cinnamon/repository
    
    # You cannot use "yarn set version latest" reliably, because it will install
    # the latest version of Yarn 1.x, if you don't have Yarn 2+ installed.
    yarn set version stable
    
    # Afterwards, run yarn --version to confirm everything was installed correctly.
    yarn --version
    # ...should output "4.x.x"
    ```
2. Run `yarn` in the repository root to install the packages and link the workspaces.
3. To build the project, use `yarn build`.

You can also use `yarn watch` to watch for changes and rebuild the project.

<br>

## License
[MIT License](LICENSE.md)
