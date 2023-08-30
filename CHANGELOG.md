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
