"use strict";
/**
 * Cinnamon Web Framework
 *
 * Copyright (c) Apollo Software Limited 2021 - MIT License
 * See /LICENSE.md for license information.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chalk = exports.Koa = exports.WebServer = exports.CinnamonPlugin = exports.CinnamonModule = exports.LoadUnless = exports.LoadIf = exports.Body = exports.Middleware = exports.Route = exports.Controller = exports.Method = exports.LoggerModule = exports.ConfigModule = exports.Logger = exports.Config = void 0;
/// <reference types="koa" />
/*
 * Cinnamon main distribution package.
 * Be sure to export all production files/APIs/classes in this distribution package.
 */
const core_1 = require("./core");
exports.default = core_1.default;
////////////////
// Framework Modules.
////////////////
var core_2 = require("./core");
Object.defineProperty(exports, "Config", { enumerable: true, get: function () { return core_2.Config; } });
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return core_2.Logger; } });
__exportStar(require("./modules/config"), exports);
var config_1 = require("./modules/config");
Object.defineProperty(exports, "ConfigModule", { enumerable: true, get: function () { return config_1.default; } });
__exportStar(require("./modules/logger"), exports);
var logger_1 = require("./modules/logger");
Object.defineProperty(exports, "LoggerModule", { enumerable: true, get: function () { return logger_1.default; } });
var web_server_1 = require("./modules/web-server");
Object.defineProperty(exports, "Method", { enumerable: true, get: function () { return web_server_1.Method; } });
Object.defineProperty(exports, "Controller", { enumerable: true, get: function () { return web_server_1.Controller; } });
Object.defineProperty(exports, "Route", { enumerable: true, get: function () { return web_server_1.Route; } });
Object.defineProperty(exports, "Middleware", { enumerable: true, get: function () { return web_server_1.Middleware; } });
Object.defineProperty(exports, "Body", { enumerable: true, get: function () { return web_server_1.Body; } });
Object.defineProperty(exports, "LoadIf", { enumerable: true, get: function () { return web_server_1.LoadIf; } });
Object.defineProperty(exports, "LoadUnless", { enumerable: true, get: function () { return web_server_1.LoadUnless; } });
__exportStar(require("./plugins/web-server"), exports);
////////////////
// Framework SDK.
////////////////
var cinnamon_module_1 = require("./sdk/cinnamon-module");
Object.defineProperty(exports, "CinnamonModule", { enumerable: true, get: function () { return cinnamon_module_1.CinnamonModule; } });
var cinnamon_plugin_1 = require("./sdk/cinnamon-plugin");
Object.defineProperty(exports, "CinnamonPlugin", { enumerable: true, get: function () { return cinnamon_plugin_1.CinnamonPlugin; } });
var web_server_2 = require("./modules/web-server");
Object.defineProperty(exports, "WebServer", { enumerable: true, get: function () { return web_server_2.default; } });
////////////////
// Third Party.
////////////////
const Koa = require("koa");
exports.Koa = Koa;
const Chalk = require("chalk");
exports.Chalk = Chalk;