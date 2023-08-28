"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preNVueJson = exports.preNVueCss = exports.preNVueHtml = exports.preNVueJs = exports.preJson = exports.preCss = exports.preHtml = exports.preJs = exports.initPreContext = void 0;
const context_1 = require("./context");
/* eslint-disable no-restricted-globals */
const { preprocess } = require('../../lib/preprocess');
var context_2 = require("./context");
Object.defineProperty(exports, "initPreContext", { enumerable: true, get: function () { return context_2.initPreContext; } });
function preJs(jsCode) {
    return preprocess(jsCode, (0, context_1.getPreVueContext)(), { type: 'js' });
}
exports.preJs = preJs;
function preHtml(htmlCode) {
    return preprocess(htmlCode, (0, context_1.getPreVueContext)(), { type: 'html' });
}
exports.preHtml = preHtml;
exports.preCss = preJs;
exports.preJson = preJs;
function preNVueJs(jsCode) {
    return preprocess(jsCode, (0, context_1.getPreNVueContext)(), { type: 'js' });
}
exports.preNVueJs = preNVueJs;
function preNVueHtml(htmlCode) {
    return preprocess(htmlCode, (0, context_1.getPreNVueContext)(), { type: 'html' });
}
exports.preNVueHtml = preNVueHtml;
exports.preNVueCss = preNVueJs;
exports.preNVueJson = preNVueJs;
