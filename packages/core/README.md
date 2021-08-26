# @apollosoftwarexyz/cinnamon-core
This package is the internal core package for Cinnamon.

This package contains the entry point for Cinnamon (the `initialize` method) in [src/main.ts](src/main.ts) which is responsible for initializing and storing references to all the modules and loading/storing the application configuration/data.

This package also contains the definition for `CinnamonModule` (in [src/module.ts](src/module.ts)) and likewise does/should contain any code or definitions that are directly interacted with by the entry point for the framework (e.g. the module definition for the module loader, the framework startup code, etc.).

**As a guiding rule; any functionality that does not directly pertain to the framework, or secondly which might be interfaced with, or shared by a Cinnamon application should be extracted into a core module or other package.** This guiding rule will most likely become apparent when you come to writing import/export statements; it will become clear what feels organic or consistent. If in doubt, raise an issue, ask for feedback in a pull request.
