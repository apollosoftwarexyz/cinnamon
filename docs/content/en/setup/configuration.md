---
title: Configuration
description: "Setting up Apollo Software's Cinnamon framework."
position: 3
category: Setup
---

<div class="page-description">
This page explains Cinnamon's <code>cinnamon.toml</code> file and serves as a reference for the various configuration options that may be set in the file.
</div>

Cinnamon uses a TOML-based configuration for each project. [TOML](https://github.com/toml-lang/toml) is a minimal configuration file format designed to be readable yet simple. **TOML files are divided into different sections called _tables_.**

Once you've initialized your project, your project will have a `cinnamon.toml` file in the root directory.

<alert>
Whilst the framework and the respective CLI is
developed, you may find that you have to
manually create this file.
</alert>

```toml[cinnamon.toml]
# An example cinnamon.toml file
# from examples/basic-webserver:

# Cinnamon project settings go here.
[framework]
    # Framework Core Settings.
    [framework.core]
        # Whether or not the app is in development mode.
        # This is overridden by NODE_ENV if it is set. Refer to the documentation for more information.
        development_mode = false

    # Framework App Settings.
    [framework.app]
        # The app's identifier, used in logging messages.
        name = "basic-webserver"

    # Framework HTTP Settings.
    # HTTPS is not built into the framework. Cinnamon applications are intended to be reverse-proxied by web servers
    # such as nginx or Apache.
    [framework.http]
        host = "0.0.0.0"
        port = 1234
        
        enable_logging = false

    [framework.structure]
        controllers = "src/controllers/"
        models = "src/models/"

# Your app-specific settings go here.
[app]
    greetings = [ "Howdy!", "Pure vibes only!" ]

```

<alert>
Consider this example the 'TL;DR' (too long; didn't read) of the below. This is intended to be a fully complete example - you most likely won't need all of these properties.
</alert>

## `[framework]` table
Any settings in your project that control the Cinnamon framework belong in this table.
These are settings such as:
- core framework settings
- app information
- http server settings
- framework directory structure

### `[framework.core]` table
These are core framework settings. Such as whether the framework is in development mode.

- `development_mode` (default: `false`) - whether the project is in development mode. If not set, the default is `false`.  
  **If `NODE_ENV` is set**, it will override this value, setting it to `true` **if and only if** `NODE_ENV=development`, or `false` otherwise.

### `[framework.app]` table
These settings tell Cinnamon about your application.

- `name` (default: `cinnamon`) - this is your app's identifier. These are used in logs. It's recommended that you use lowercase, URL-safe characters in your app's identifier for maximum flexibility with this identifier.

### `[framework.http]` table
These HTTP settings are passed to Cinnamon's internal WebServer module (which in turn passes most of them to [Koa](https://koajs.com)).

- `host` (default: `0.0.0.0` - all hosts) - this is the HTTP host interface that the server will listen on. Typically, this will be one of:
  - `127.0.0.1` (the loopback interface) which means only users on the local system can access the server, useful for development, or:
  - `0.0.0.0` (all hosts) which means the server will be bound to any interface. This is the expected default for any public web service.

- `port` (default: `5213`) - this is the port the HTTP server will listen on. For permission and conflict-avoidance reasons, this does not default to port `80`.

- `enable_logging` (default: `false`) - whether web requests should be logged as they are made. _We leave this off by default because in production on medium to large apps this can cause **huge** file sizes if you're using disk-based logging_, however the expectation is that this would almost always be kept on for debugging and may be useful for auditing secure web services too.
  - Regardless of whether `enable_logging` is `true` or `false`, web requests that resulted in a server error (>= 500) will *always* be logged.

### `[framework.structure]` table
These settings indicate your directory structure to Cinnamon. We recommend that you leave these as the defaults which are tried and tested in our products.

- `controllers` (default: `src/controllers/`) - this is the directory (relative to your project root) that contains the API route controllers.

- `models` (default: `src/models/`) - this is the directory (relative to your project root) that contains the API models.

## `[app]` table
This table contains your app settings. You are free to organize this as you please.

Cinnamon provides an API to access settings from your project's `cinnamon.toml`, including from the `[app]` table, and perform validation.
