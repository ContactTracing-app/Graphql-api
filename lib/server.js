"use strict";
/**
 * @description Entry point for application
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
var app_1 = __importDefault(require("./app"));
var appConfigs_1 = __importDefault(require("./appConfigs"));
var app = new app_1.default(appConfigs_1.default.PORT);
app.listen();
