---
title: Config
description: "Cinnamon Config module."
position: 10
category: Modules
---

<div class="page-description">
The Config module allows you to access and perform validation on your
app-specific configuration in <code>cinnamon.toml</code>.
</div>

There are two key ways to access the Config module in an application; you can
import the `Config` global into your project file and access the Config module
for the default Cinnamon instance:

```ts
import { Config } from '@apollosoftwarexyz/cinnamon';

// Fetches the value of the 'greetings' key under the
// [app] table in cinnamon.toml.
Config.get('greetings');
```

Or, alternatively, you can get the Config module on a specific Cinnamon
framework instance:
```ts
// ...
framework.getModule<Config>(Config.prototype).get('greetings');
```

## Project Config
You can get all the keys defined in the `[app]` table of your project's
`cinnamon.toml` file with the Config module's `get` method and, likewise, you
can also inject any keys at runtime, with the `set` method of the Config
module, if you like.

Essentially, the `[app]` table is there, as a convenience, for you to use to
define your app-specific settings without having to build or include some other
form of configuration management like environment files.

Using Cinnamon for your app-specific configuration is also helpful because you
get validation support for your app-specific configuration out of the box and
missing keys can be automatically identified and, soon, automatically moved to
a template configuration which can be helpful when you `.gitignore` your
configuration to allow unique local configurations – or as a security measure
for public projects.

## Config Validation
Enabling config validation is as simple as passing a `appConfigSchema` to
Cinnamon when you call `Cinnamon.initialize`. If the value is not set, it's
ignored and any configuration will be considered valid, otherwise the `[app]`
table of your configuration will be validated against the `appConfigSchema`.

```ts[src/main.ts]
import Cinnamon from '@apollosoftwarexyz/cinnamon';

(async () => {
    await Cinnamon.initialize({
        // ...
        appConfigSchema: {
            maintenance_mode: {
                type: 'boolean',
                required: true,
            }
        }
    });
})();
```

If validation occurs and fails, the app configuration will not be loaded (it
will be set to `null`, and therefore `get` and `set` calls on the configuration
will throw an error).

You can check if the application configuration loaded by checking the value of
`didFailValidation` on the config module (i.e., `Config.didFailValidation`).
