# cinnamon-internals

This contains shared or reusable, internal, code for the Cinnamon framework and
its core modules.

Whilst this code is technically visible to external packages, we would
***highly discourage*** third-party packages from using this code directly as
the API is not at all guaranteed to be stable and may change at any time.

This package exists solely to reduce code duplication between the core modules
of the Cinnamon framework and should not even be used by plugins.
