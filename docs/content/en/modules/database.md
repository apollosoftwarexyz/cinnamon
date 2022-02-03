---
title: Database
description: "Cinnamon Database module."
position: 11
category: Modules
---

<div class="page-description">
The Database module allows you to quickly and easily connect to, query and 
update external databases.
</div>

<alert type="danger">
<b>Deprecated!</b> This approach to the database is deprecated and scheduled to be
removed from future releases of Cinnamon in favor of HarperDB.
</alert>

The Database module in Cinnamon is very trivial. We found
[Mikro-ORM](https://mikro-orm.io) delivered pretty much all the functionality
we were looking for in Cinnamon, included some neat features – and did so
with an API fairly consistent with our own.

Thus, our Database module is simply a wrapper to initialize Mikro-ORM based on
Cinnamon's configuration file and a means of injecting Mikro-ORM's APIs into
the request context passed to your routes. **For any information not included
here, you should defer to [Mikro-ORM's documentation](https://mikro-orm.io).**

## Configuration
To use the Database module, you'll need to add your database configuration to
`cinnamon.toml`. The database is configured in the `[framework.database]`
table. To see an example, refer to the
[configuration reference](/reference/configuration).

If you'd like to use a database with your project, be sure to at least set
`enabled` under `[framework.database]` to `true`, as without that setting, the
database module won't be loaded. Again, see the
[configuration reference](/reference/configuration) for more information.

## Compatible Databases
Cinnamon should theoretically support any database supported by Mikro-ORM. We
explicitly support MongoDB, PostgreSQL, MySQL/MariaDB and SQLite. However, only
MongoDB support has actually been tested thus far, so please let us know if you
have issues with any of the other explicitly supported databases.

## Models
Database models are loaded from the configured models directory (by default,
`/src/models`).

> In Cinnamon, the terms 'entity' and 'model' are analogous in a database
> context. We generally refer to the entities as models in the file structure,
> however Mikro-ORM refers to them as entities. If you'd prefer to consistently
> describe them as entities, you can change the models directory in your
> `cinnamon.toml` file to be `/src/entities` instead.

## The Entity Manager

The typical way to access the Database is by requesting the entity manager from
your current request's context:
```ts[src/controllers/v1/ExampleController.ts]

    // ...
    
    @Route(Method.GET, '/')
    public async index(ctx: Context) {
    
        // Get the entity manager.
        const em = ctx.getEntityManager()!;
        
        // Bear in mind, the entity manager instance
        // is nullable by default, so you'll want to
        // either ensure or assert (as shown above)
        // that it is not null.
        
        // ...
    
    }

```

<alert>

When you're accessing the database from a route (request handler), it's
important that you use the entity manager on the request context (by calling
`ctx.getEntityManager`) because Cinnamon automatically forks the Entity Manager
and injects it into the current request context. Doing this means each request
uses a request-specific fork of the Entity Manager so the ORM identity maps
don't collide.

<br>

For more information, please refer to Mikro-ORM's documentation:
https://mikro-orm.io/docs/installation/#request-context

</alert>

However, for instances where you need to make Database queries outside a route
(e.g., on initialization), you can access the main Entity Manager instance on
the Database module by fetching the Database module from a given Cinnamon
instance:

```ts
// ...

const em = framework.getModule<Database>(Database.prototype).em;

// Bear in mind, the entity manager instance is nullable by
// default, so you'll want to either ensure or assert that
// it is not null.

// ...
```

## Mikro-ORM's Command Line Interface (CLI)
Cinnamon supports usage of Mikro-ORM's CLI by including a `mikro-orm.config.ts`
(which may be found [here](https://github.com/apollosoftwarexyz/cinnamon/blob/master/examples/basic-webserver/src/mikro-orm.config.ts))
that initializes Cinnamon's essentials only and then reads the Database
configuration from the Database module. **This file is included, by default, in
any projects initialized with Cinnamon's CLI.**

You can therefore invoke Mikro-ORM's CLI with `npx`:
```bash
npx mikro-orm <command>
```

If you'd like to verify your database setup, you can use the
`npx mikro-orm debug` command.

## Troubleshooting
- **If your entity (model) files aren't being loaded correctly, at all, or are
  throwing an error on load**, be sure you're importing `.ts` (TypeScript)
  files.
  Using JavaScript files with Cinnamon is undefined behavior, is unsupported
  and is unlikely to work at all. You should write TypeScript and execute
  TypeScript in runtime during development and in production with `ts-node`.

  There is no performance penalty for doing this (save for a few extra seconds
  of load time) and this allows for performing runtime type checking and safer
  type introspection as well as reducing errors introduced during the
  TypeScript-to-JavaScript transpilation/compilation process.

- **If your entities are not updating**, make sure you've restarted the server
  since you last modified the entity. Entities are not hot-reloaded to avoid
  causing accidental damage to the database. Additionally, indexes and
  constraints are only rebuilt/reapplied when Mikro-ORM initializes during
  Cinnamon's own initialization procedure.

- **If a removed index or constraint is still being applied**, you may have to
  drop the index, constraint or table/collection depending on your database.
