/**
 * Cinnamon Web Framework
 *
 * Copyright (c) Apollo Software Limited 2021 - MIT License
 * See /LICENSE.md for license information.
 */

/*
 * Cinnamon main distribution package.
 * Be sure to export all production files/APIs/classes in this distribution package.
 */

////////////////
// Framework Core.
////////////////
import Cinnamon from "@apollosoftwarexyz/cinnamon-core";
export default Cinnamon;

////////////////
// Framework Modules.
////////////////
export * from '@apollosoftwarexyz/cinnamon-core-modules';
export * from '@apollosoftwarexyz/cinnamon-validator';
export { Method, Controller, Route, Middleware, Body, LoadIf, LoadUnless } from '@apollosoftwarexyz/cinnamon-web-server';

////////////////
// Framework SDK.
////////////////
export * from '@apollosoftwarexyz/cinnamon-sdk';
export { default as WebServer, CinnamonWebServerModulePlugin } from '@apollosoftwarexyz/cinnamon-web-server';
export { default as Database } from '@apollosoftwarexyz/cinnamon-database';

////////////////
// Third Party.
////////////////
import * as Koa from 'koa';
import { Context, Next } from 'koa';
export { Koa, Context, Next };

import Chalk from 'chalk';
export { Chalk };
