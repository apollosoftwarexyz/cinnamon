/**
 * Cinnamon main distribution package.
 * Be sure to export all production files/APIs/classes in this distribution package.
 */

////////////////
// Framework Core.
////////////////
import Cinnamon, { CinnamonModule } from "@apollosoftwarexyz/cinnamon-core";
export default Cinnamon;

////////////////
// Framework APIs.
////////////////
export { CinnamonModule };

////////////////
// Framework Modules.
////////////////
export * from '@apollosoftwarexyz/cinnamon-core-modules';
export { Method, Controller, Route, Middleware } from '@apollosoftwarexyz/cinnamon-web-server';

////////////////
// Third Party.
////////////////
import * as Koa from 'koa';
import { Context, Next } from 'koa';
export { Koa, Context, Next };
