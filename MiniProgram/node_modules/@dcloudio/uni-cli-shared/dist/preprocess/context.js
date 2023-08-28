"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPreContext = exports.getPreNVueContext = exports.getPreVueContext = void 0;
const shared_1 = require("@vue/shared");
const DEFAULT_KEYS = [
    'APP',
    'APP_NVUE',
    'APP_PLUS',
    'APP_PLUS_NVUE',
    'APP_VUE',
    'APP_ANDROID',
    'APP_IOS',
    'H5',
    'MP',
    'MP_360',
    'MP_ALIPAY',
    'MP_BAIDU',
    'MP_QQ',
    'MP_LARK',
    'MP_TOUTIAO',
    'MP_WEIXIN',
    'MP_KUAISHOU',
    'MP_JD',
    'QUICKAPP_NATIVE',
    'QUICKAPP_WEBVIEW',
    'QUICKAPP_WEBVIEW_HUAWEI',
    'QUICKAPP_WEBVIEW_UNION',
    'VUE2',
    'VUE3',
    'WEB',
];
const preVueContext = Object.create(null);
const preNVueContext = Object.create(null);
function getPreVueContext() {
    return preVueContext;
}
exports.getPreVueContext = getPreVueContext;
function getPreNVueContext() {
    return preNVueContext;
}
exports.getPreNVueContext = getPreNVueContext;
function initPreContext(platform, userPreContext) {
    const vueContext = Object.create(null);
    const nvueContext = Object.create(null);
    const defaultContext = Object.create(null);
    DEFAULT_KEYS.forEach((key) => {
        defaultContext[key] = false;
    });
    defaultContext[normalizeKey(platform)] = true;
    vueContext.VUE3 = true;
    nvueContext.VUE3 = true;
    if (platform === 'app' || platform === 'app-plus') {
        defaultContext.APP = true;
        defaultContext.APP_PLUS = true;
        vueContext.APP_VUE = true;
        nvueContext.APP_NVUE = true;
        nvueContext.APP_PLUS_NVUE = true;
    }
    else if (platform.startsWith('mp-')) {
        defaultContext.MP = true;
    }
    else if (platform.startsWith('quickapp-webview')) {
        defaultContext.QUICKAPP_WEBVIEW = true;
    }
    else if (platform === 'h5') {
        defaultContext.WEB = true;
    }
    if (userPreContext) {
        if ((0, shared_1.isString)(userPreContext)) {
            try {
                userPreContext = JSON.parse(userPreContext);
            }
            catch (e) { }
        }
        if ((0, shared_1.isPlainObject)(userPreContext)) {
            Object.keys(userPreContext).forEach((key) => {
                defaultContext[normalizeKey(key)] = !!userPreContext[key];
            });
        }
    }
    (0, shared_1.extend)(preVueContext, defaultContext, vueContext);
    (0, shared_1.extend)(preNVueContext, defaultContext, nvueContext);
}
exports.initPreContext = initPreContext;
function normalizeKey(name) {
    return name.replace(/-/g, '_').toUpperCase();
}
