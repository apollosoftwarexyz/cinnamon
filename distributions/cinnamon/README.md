# Cinnamon
by [Apollo Software Limited](https://apollosoftware.xyz/)

---

> _"The line of code that's the fastest to write, that never breaks, that doesn't need maintenance, is the line you never had to write."_

Cinnamon is a backend web framework inspired by [Nuxt.js](https://github.com/nuxt/nuxt.js) as a frontend counterpart. With Cinnamon, our key aim is to achieve minimal code repetition between projects to allow developers to focus on developing their specific application.

Cinnamon is intended for projects where your backend service is isolated from your frontend such as a mobile or single-page web application - meaning the backend is entirely data and business logic driven.

👉 **Learn more on our documentation site:**
https://cinnamon.apollosoftware.xyz/

## Features
- [x] Configurable with `cinnamon.toml`
- [x] Logger module (extensive logging for your application)
    - [ ] Logger delegate support (handle log events - e.g., for logging remotely)
- [x] Web Server module (for backend API service controllers) using [Koa](https://github.com/koajs)
    - [x] Hot reload for API service controllers
    - [x] Middleware and Routing support
    - [ ] Static file hosting support
- [ ] WebSocket module (integrated with Web Server module)
- [ ] Database ORM module using [Mikro-ORM](https://mikro-orm.io)
- [x] Validation module (for data validation on JavaScript/JSON objects)
    - [ ] Middleware for Web Server module
- [ ] Session Management and Authentication module
- [ ] CLI tooling and utilities
    - [ ] CLI helpers for production and development tasks
    - [ ] Support for shell script generation

## Development
1. Apollo Software Cinnamon uses [Yarn Berry (3.x)](https://yarnpkg.com/getting-started/install) for workspace management. You should install it with `yarn set version latest`:
  ```bash
  # To install Yarn 3.x globally:
  npm i -g yarn
  cd ~
  yarn set version latest
  
  # To update the local version:
  cd /path/to/cinnamon/repository
  yarn set version latest
  ```
2. Run `yarn` in the repository root to install the packages and link the workspaces.
3. Once you're set up, you should run `yarn docs:dev`, to run the documentation site in interactive development mode. The documentation site uses [Nuxt.js](https://nuxtjs.org) with the content plugin which allows you to update the documentation either by editing the markdown files, or by double-clicking on a documentation page and interactively editing the site.
4. To build the project, use `yarn build`. You can also use `yarn example:start`, to run the example project.

## License
[MIT License](LICENSE.md)
