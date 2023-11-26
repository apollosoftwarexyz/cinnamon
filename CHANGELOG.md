# v0.2.0
- Refactor `@apollosoftwarexyz/cinnamon-internals` to remove namespaces and
  improve code quality.
  - Add unit tests to `@apollosoftwarexyz/cinnamon-internals`.
- Add `CinnamonModuleRegistry` for internal modules to improve performance on
  registering and resolving modules.
- Add `CinnamonHookRegistry` for hooks to improve performance on triggering
  hooks and allow for a centralized, type-safe, set of hooks that are unified
  and accessible by both plugins and modules.
  - Deprecate `CinnamonWebServerModulePlugin` in favor of the new hook system
    and `CinnamonHookConsumer` interface.
- Add `autoConnect` as a configuration option for the database module.
- Removed the `terminateOnInitError` option from the database module (it is now
  always enabled).
- Convert the framework passed to each module to a proxy to allow for
  additional functionality to be added to the framework without breaking
  existing modules.
  - Automatically inject a per-module logger into the module's framework proxy.
  - Allow modules to register hooks via their proxy, but only allow plugins to
    trigger hooks (per the API contracts implied by both plugins and modules).
- Added `prepareContext` hook to allow plugins to prepare the context before
  the request is processed and before hooks are triggered on the request.
- Deprecate `em` alias for `entityManager` on the database module and remove
  the `requestContext` getter (use `ctx` instead).
- Dropped support for Node.js versions below 18. Now supports Node.js 18+ and
  tests against Node.js 18, 20.10.0 (LTS) and 21.

# v0.1.5 (release candidate)
- Bump dependencies to latest versions.
- Add array support to Cinnamon's validation library.
- Remove `@apollosoftwarexyz/cinnamon-cli` package in favor of `create-cinnamon-project`.
- Bump Cinnamon to Yarn 4.0.0.
- Minor code base fixes with by activating the linter.

# v0.1.4
- Bump all Cinnamon components and modules to v0.1.4.
- Bump general dependencies to latest versions.
- Patch Cinnamon's validation library to more gracefully handle errors when
  validating invalid payloads (e.g., when an object was expected, but a 
  primitive value was provided).

# v0.1.3
- Update the body parser middleware to also accept url-encoded payloads by
  default.

# v0.1.2
- Add `fileReader` option to `SendFileOptions`. This allows the file to be read
  using a custom file reader function. This is useful for reading files from
  non-standard locations (e.g. a database or a remote file store such as S3).
- Improve preprocessor support by introducing `PreprocessorContext` that allows
  streaming file contents into a preprocessor (useful for streaming files into
  a templating engine, minifier or compression tool).

# v0.1.1
- **General availability release**
- Add static file preprocessor and `optionalExtensions` option (allows setting
  of extensions that may be omitted from request URLs)
- Add `extensionless` option to allow extensionless URLs to be served (like
  `optionalExtensions` but throws a 404 if an extension is explicitly provided)
- Add additional hook for error handling (`beforeRegisterErrors`) to allow
  plugins greater control over error handling and responses.
- Inject the Cinnamon framework instance into the request context
  (`ctx.framework`).

# v0.1.0-beta.1
- **General availability release candidate**

# v0.0.0 - v0.0.36
- **Internal pre-release versions**
