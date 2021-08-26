# @apollosoftwarexyz/cinnamon-core-modules
This package acts as a 'holder' for Cinnamon's core module class aliases.

This package imports all of Cinnamon's core modules (modules that are activated by default), waits for the default Cinnamon instance to initialize the modules, and re-exports them as appropriately named fields, so they may be used globally.

## Core Modules
Core Modules are component 'packages' of Cinnamon ([/packages](/packages)) that are accessible to the distribution packages ([/distributions](/distributions)) which will re-export classes, fields, etc., from the component packages to make them available to developers who install the distribution package. The default distribution package is `cinnamon` (`@apollosoftwarexyz/cinnamon`) which exports all component packages necessary to build a backend web service.

This package may not reference all core modules - e.g. internal modules not accessed outside of Cinnamon - but this is a good place for core module developers to start.

If you're developing a core module, please keep the following in mind:

**General Notes:**
- You should add `@CoreModule` to your package's constructor.
- It should be placed in [/packages](/packages).
- You are free to use [/packages/core-internals](/packages/core-internals) (`@apollosoftwarexyz/cinnamon-core-internals`) if, **and only if**, the package is a core module and won't be accessed by any package or code outside the framework core package or other core modules.

**Naming Notes:**
- The `package.json` naming convention is `@apollosoftwarexyz/cinnamon-<package-name>`, though you are free to use a different organization name as an external developer. The directory name should then, of course, be `<package-name>`.
- If your component package's ([/packages](/packages)) name conflicts with a distribution package's ([/distributions](/distributions)) name, prepend `core-` to your package. *This should also be done for meta packages (packages that are solely used for organizing other packages, such as this one) or internal/core-only packages such as core-internals.*
