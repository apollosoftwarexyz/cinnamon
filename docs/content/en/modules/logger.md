---
title: Logger
description: "Cinnamon Logger module."
position: 12
category: Modules
---

<div class="page-description">
The Logger module allows you to easily log messages from your application.
</div>

There are two key ways to access the Logger module in an application; you 
can import the `Logger` global into your project file and access the Logger 
for the default Cinnamon instance:
```ts
import { Logger } from '@apollosoftwarexyz/cinnamon';
Logger.info("Hello, world!");
```

Or, alternatively, you can call the Logger on a specific Cinnamon framework 
instance:

```ts
// ...
framework.getModule<Logger>(Logger.prototype).info("Hello, world!");
```

## Log Levels
The logger exposes methods for each of the log levels:
- `debug`: used for app-level debugging messages. These are not printed if the
  logger is not showing debug messages (i.e., if `development_mode` is off),
  however they will still be passed to the [logger delegate](#logger-delegate).
- `info`: used for general information messages. A typical example is printing
  status messages. You should **not** use this logging level for printing:
  - **warnings or errors:** use the appropriate level (either `warn`, or
    `error`), so they are more apparent in drawing attention and so the
    delegate can handle the warnings and errors appropriately (e.g., correctly
    dispatching notifications or for organization.)
  - **debugging information** use `debug`, so the delegate has more control
    over logging messages (e.g., the information might be useful for local
    debugging, but they may pollute logs or data for external logging/auditing
    tools.) Not using `info` for debugging information also helps keep log file
    sizes down in production.
- `warn`: used for warning messages. These are messages that may be important,
  and are thus highlighted but are not crucial or detrimental to the operation
  of the application or framework. For example, deprecation messages, inability
  to locate or activate a soft dependency, etc.
- `error`: used for error messages. These messages are critical. Whilst not
  necessarily indicating a crash will/has occurred, an error message indicates
  that something on the server has not functioned as expected because of a
  problem with the application which would need to be rectified somehow.
  **Ensuring this is used correctly can absolutely help you keep track of
  important errors in your application and therefore fixes that need to be made
  because a logger delegate can be used to report the errors.**

## Logger Delegate
It is often useful to report logs to a central service, particularly error 
logs, or even specific events for auditing and analysis. With Cinnamon, you 
can do this by using our 'logger delegate' feature.

A 'logger delegate' is a function that is run every time something is logged,
allowing you to perform custom actions with those log entries such as 
logging errors with a remote dashboard and performing certain actions based 
on specific logged messages. You can define it as an option when you call 
`Cinnamon.initialize()`:
```ts[src/main.ts]
import Cinnamon, { DelegateLogEntry } from '@apollosoftwarexyz/cinnamon';

(async () => {
    await Cinnamon.initialize({
        // ...
        loggerDelegate (message: DelegateLogEntry) {
            // TODO: do something with the log entry.
        }
    });
})();
```


