<h1 align="center">Cinnamon</h1>
<p align="center">
    Built with ❤︎ by <a href="https://apollosoftware.xyz/">Apollo Software Limited</a>
</p>

<br><br>

> _"The line of code that's the fastest to write, that never breaks, that doesn't need maintenance, is the line you never had to write."_

Cinnamon is a backend web framework with a key aim to achieve minimal code repetition between projects, allowing developers to focus on their product and not boilerplate.

👉 **Learn more on our documentation site:**
https://cinnamon.apollosoftware.xyz/

<br>

```ts
import { Controller, Route, Method, Context } from '@apollosoftwarexyz/cinnamon';

@Controller('api', 'v1')
export default class IndexController {

    @Route(Method.GET, '/')
    public async index(ctx: Context): Promise<void> {
        ctx.body = 'Hello, world!';
    }

}
```

<br>

## Features
- [x] Configurable with `cinnamon.toml`
- [x] Logger module (extensive logging for your application)
    - [x] Logger delegate support (handle log events - e.g., for logging remotely)
- [x] Web Server module (for backend API service controllers) using [Koa](https://github.com/koajs)
    - [x] Hot reload for API service controllers
    - [x] Middleware and Routing support
    - [x] Static file hosting support
- [ ] WebSocket module (integrated with Web Server module)
- [x] Database ORM module using [Mikro-ORM](https://mikro-orm.io)
- [x] Validation module (for data validation on JavaScript/JSON objects)
    - [x] Middleware for Web Server module
- [ ] Session Management and Authentication module
- [ ] CLI tooling and utilities
    - [ ] CLI helpers for production and development tasks
    - [ ] Support for shell script generation
- [ ] Additional hot reload
  - [ ] Allow specifying directories with reload 'type' (`restart`, `only-config`, `only-controllers`) on change.
  - [ ] Hot-reload `cinnamon.toml` by default.

## Development
1. Apollo Software Cinnamon uses [Yarn Berry (3.x)](https://yarnpkg.com/getting-started/install) for workspace management. You should install it with `yarn set version latest`:
  ```bash
  # To install Yarn 3.x globally:
  npm i -g yarn
  cd ~
  yarn set version latest
  
  # To update the local version:
  cd /path/to/cinnamon/repository
  
  # ...for compatibility reasons, this step is important for yarn 1.
  # ...yarn 1, by default, will not install versions newer than 1.x with "yarn set version latest"
  yarn set version stable
  
  # After running "yarn set version stable", run this to ensure you're on the latest release of
  # yarn berry.
  yarn set version latest
  
  # Afterwards, run yarn --version to confirm everything was installed correctly.
  yarn --version
  # ...should output "3.x.x"
  ```
2. Run `yarn` in the repository root to install the packages and link the workspaces.
3. Once you're set up, you should run `yarn docs:dev`, to run the documentation site in interactive development mode. The documentation site uses [Nuxt.js](https://nuxtjs.org) with the content plugin which allows you to update the documentation either by editing the markdown files, or by double-clicking on a documentation page and interactively editing the site.
4. To build the project, use `yarn build`. You can also use `yarn example:start`, to run the example project.

## License
[MIT License](LICENSE.md)
