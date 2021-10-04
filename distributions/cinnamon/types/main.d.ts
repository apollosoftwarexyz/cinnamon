/**
 * Cinnamon Web Framework
 *
 * Copyright (c) Apollo Software Limited 2021 - MIT License
 * See /LICENSE.md for license information.
 */
import Cinnamon from "@apollosoftwarexyz/cinnamon-core";
export default Cinnamon;
export * from '@apollosoftwarexyz/cinnamon-core-modules';
export { Method, Controller, Route, Middleware } from '@apollosoftwarexyz/cinnamon-web-server';
export * from '@apollosoftwarexyz/cinnamon-validator';
import * as Koa from 'koa';
import { Context, Next } from 'koa';
export { Koa, Context, Next };
import * as Chalk from 'chalk';
export { Chalk };
