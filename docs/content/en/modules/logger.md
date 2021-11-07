---
title: Logger
description: "Cinnamon Logger module."
position: 10
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

## Logger Delegate
It is often useful to report logs to a central service, particularly error 
logs, or even specific events for auditing and analysis. With Cinnamon, you 
can do this by using our 'logger delegate' feature.

A 'logger delegate' is a function that is run every time something is logged,
allowing you to perform custom actions with those log entries such as 
logging errors with a remote dashboard and performing certain actions based 
on specific logged messages. You can define it as an option when you call 
`Cinnamon.initialize()`:
```ts{6-8}[src/main.ts]
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


