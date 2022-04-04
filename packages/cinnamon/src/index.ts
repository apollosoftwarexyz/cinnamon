/**
 * Cinnamon Web Framework
 *
 * Copyright (c) Apollo Software Limited 2021 - MIT License
 * See /LICENSE.md for license information.
 */

/// <reference types="koa" />

/*
 * Cinnamon main distribution package.
 * Be sure to export all production files/APIs/classes in this distribution package.
 */

import Cinnamon from './core';
export default Cinnamon;

////////////////
// Framework Modules.
////////////////
export { Config, Logger } from './core';
export * from './modules/config';
export { default as ConfigModule } from './modules/config';
export * from './modules/logger';
export { default as LoggerModule } from './modules/logger';

export { Method, Controller, Route, Middleware, Body, LoadIf, LoadUnless } from './modules/web-server';
export * from './plugins/web-server';

////////////////
// Framework SDK.
////////////////
export { CinnamonModule } from './sdk/cinnamon-module';
export { CinnamonPlugin } from './sdk/cinnamon-plugin';
export { default as WebServer, CinnamonWebServerModulePlugin } from './modules/web-server';

////////////////
// Third Party.
////////////////
import * as Koa from 'koa';
import { Context as KoaContext, Next } from 'koa';
export { Koa, Next };

import {SendFileOptions} from "./modules/web-server/lib/files";

export interface Context extends KoaContext {
    sendFile(path: string, options: SendFileOptions) : Promise<void>;
}

import * as Chalk from 'chalk';
export { Chalk };
