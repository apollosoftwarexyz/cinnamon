# Versions and Project Status

**Cinnamon is currently in beta.**

We are actively working on the framework and welcome feedback and
contributions, however, until any release versions are published, we will only
support the the latest release of Cinnamon at any given time and hold the
expectation that any users will create projects only for the newest version of
the framework and update their projects themselves if they need to use a newer
version of the framework for any reason.

## Supported Versions

| Version            | Supported                                                 |
|--------------------|-----------------------------------------------------------|
| Latest npm Release | :white_check_mark: (currently the only supported version) |

See [Version History](#version-history) below for details on the version
history of the framework.

## Support Policy

Cinnamon is presently in **beta**, which means that we will only support the
latest release of the framework, on npm (or identical mirrored copies of the
framework on other package registries, such as GitHub Packages or Yarn's
package registry), at any given time.

Please note that this policy is subject to change at any time and is merely an
informal statement of our intentions. It is not a contract or guarantee of any
kind. Please see our [Policy Roadmap](#policy-roadmap) below for details on
how this policy may change in the future.

**In addition, please note that your use of the Cinnamon framework, in
accordance with the MIT License ([LICENSE.md](LICENSE.md)) which governs your
use of this Software, its source code, binaries and any other assets or
resources, etc., is WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.**

**You MAY NOT hold Apollo Software Limited liable for any damages or losses
incurred by your use of the Cinnamon framework.**

**We will:**
- provide security updates for the latest release of Cinnamon.
- provide bug fixes for the latest release of Cinnamon.
- provide documentation for the latest release of Cinnamon on a best-effort
  basis.
- provide support for the latest release of Cinnamon on a best-effort basis.

**We will not (other than on a best-effort basis AND at our discretion):**
- provide security updates for older versions of Cinnamon.
- provide bug fixes for older versions of Cinnamon.
- update documentation for older versions of Cinnamon.
- backport security updates and bug fixes to older versions of Cinnamon.
- provide support for older versions of Cinnamon.

## API Stability Policy

Cinnamon is presently in **beta**, which means that we will not guarantee that
the API surface or behaviors of the framework will remain stable between
releases.

Until we release a "major" version of Cinnamon (i.e., 1.0.0), we will not
guarantee that the API surface of the framework will remain stable between
releases. This means that we may introduce breaking changes to the API surface
of the framework at any time, without warning, and without any guarantee that
we will provide any migration path for users of the framework.

That said, we will make best efforts to follow the following guidelines:
- Semantic Versioning (semver) will be used to version the framework.
- We will not introduce breaking changes to the API surface of the framework
  without incrementing the minor version number of the framework.
- We will **deprecate** features of the framework for at least one minor
  version before removing them.
- We will not introduce breaking changes to the API surface of the framework
  without providing a migration path for users of the framework.
- We may change behaviors of the framework at any increment of any version
  of the framework, including patch versions, provided that this change of
  behavior is reasonably expected to not break any existing users of the
  framework. These changes will be documented in the CHANGELOG.md file of the
  framework.

## Policy Roadmap
Note, as mentioned above, that Cinnamon is presently considered to be in
**beta** and this will continue to be the case until we release a "major"
version of the framework (i.e., 1.0.0).

When we release a "major" version of Cinnamon (i.e., 1.0.0), these policies
will be updated to reflect the non-beta status of the framework when we may
introduce formal support policies which may include LTS releases and/or paid
support plans.

We pledge that these paid plans will **solely** be for the purposes of assisting
users of Cinnamon in their use of the framework and that we will not alter the
framework in any way to encourage users to purchase these plans (except to
introduce **new** features that are only available to users of these plans,
where these features will be clearly documented as such and will not adversely
affect existing free features or functionality of the framework).

## Version History

| Version         | Node.js versions    | Yarn versions               | TypeScript versions | Mikro-ORM Versions | Supports Compilation? |
|-----------------|---------------------|-----------------------------|---------------------|:-------------------|:----------------------|
| v0.2.0          | v20.x, v21.x        | Yarn Berry (4+ recommended) | 5.3.2               | 5.9.4+             | **PARTIALLY**         |
| v0.0.0 - v0.1.5 | v14.x, v16.x, v17.x | Yarn Berry (3+ recommended) | 4.3.5+              | 4.5.9+             | **NO**                |
