/**
 * Cinnamon main distribution package.
 * Be sure to export all production files/APIs/classes in this distribution package.
 */
import Cinnamon, { CinnamonModule } from "@apollosoftwarexyz/cinnamon-core";
export default Cinnamon;
export { CinnamonModule };
export * from '@apollosoftwarexyz/cinnamon-core-modules';
export { Method, Controller, Route, Middleware } from '@apollosoftwarexyz/cinnamon-web-server';
export * from '@apollosoftwarexyz/cinnamon-validator';
import * as Koa from 'koa';
import { Context, Next } from 'koa';
export { Koa, Context, Next };
