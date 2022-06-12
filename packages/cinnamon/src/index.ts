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

export { Method, Controller, Route, Middleware, MiddlewareFn, Body, LoadIf, LoadUnless } from './modules/web-server';
export * from './plugins/web-server';

import cinnamonInternals from '@apollosoftwarexyz/cinnamon-internals';
import HttpError = cinnamonInternals.error.HttpError;
export { HttpError };

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
import { Context as KoaContext, Request as KoaRequest, Next } from 'koa';
import { Fields, Files } from 'formidable';

export { Koa, Next, KoaContext as _Context };

import { SendFileOptions } from './modules/web-server/lib/files';

export interface Request<BodyType> extends KoaRequest {

    /**
     * The request body.
     * Your route must have the Body middleware applied to it or this will throw an error.
     */
    body?: BodyType;

    /**
     * The raw, unparsed, request body.
     * Your route must have the Body middleware applied to it or this will throw an error.
     */
    rawBody?: any;

    /**
     * If a multipart form body is used and files are uploaded to that form, they may be
     * accessed here.
     *
     * This is set by the formidable package under-the-hood.
     */
    files?: Files;
}

/**
 * The Cinnamon request/response context. This extends Koa's context type to include any
 * Cinnamon-specific parameters or methods.
 */
export interface Context<RequestBodyType = any> extends KoaContext {
    /**
     * The Cinnamon framework instance that handled the request.
     */
    framework: Cinnamon;

    request: Request<RequestBodyType>;

    /**
     * If there was an error in any of the routes processing the request, it'll
     * be set here.
     *
     * This is primarily intended for use in plugins.
     */
    errorObject?: any;

    /**
     * Loads the specified file, relative to `options.path` and responds to the
     * request with the specified file.
     *
     * @see SendFileOptions
     *
     * @param path The path, relative to `options.root` that should be loaded.
     * @param options Refer to SendFileOptions
     */
    sendFile(path: string, options: SendFileOptions) : Promise<void>;
}

/**
 * An alias for formidable's Fields type intended for readability when parameterizing
 * Context.
 *
 * @see Context
 */
export type MultipartFormBody = Fields;

/**
 * An alias for a context parameterized with MultipartFormBody.
 *
 * @see Context
 */
export type MultipartRequestContext = Context<MultipartFormBody>;

import * as Chalk from 'chalk';
export { Chalk };
