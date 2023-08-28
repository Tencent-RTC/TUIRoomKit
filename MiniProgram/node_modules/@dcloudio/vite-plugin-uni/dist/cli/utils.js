"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printStartupDuration = exports.cleanOptions = exports.initEnv = exports.addConfigFile = exports.PLATFORMS = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const picocolors_1 = __importDefault(require("picocolors"));
const perf_hooks_1 = require("perf_hooks");
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const nvue_1 = require("./nvue");
exports.PLATFORMS = [
    'app',
    'h5',
    'mp-alipay',
    'mp-baidu',
    'mp-qq',
    'mp-lark',
    'mp-toutiao',
    'mp-weixin',
    'quickapp-webview',
    'quickapp-webview-huawei',
    'quickapp-webview-union',
];
function resolveConfigFile() {
    const viteConfigJs = path_1.default.resolve(process.env.UNI_INPUT_DIR, 'vite.config.js');
    const viteConfigTs = path_1.default.resolve(process.env.UNI_INPUT_DIR, 'vite.config.ts');
    if (fs_1.default.existsSync(viteConfigTs)) {
        return viteConfigTs;
    }
    if (fs_1.default.existsSync(viteConfigJs)) {
        return viteConfigJs;
    }
    return path_1.default.resolve(process.env.UNI_CLI_CONTEXT, 'vite.config.js');
}
function addConfigFile(inlineConfig) {
    if ((0, uni_cli_shared_1.isInHBuilderX)()) {
        inlineConfig.configFile = resolveConfigFile();
    }
    return inlineConfig;
}
exports.addConfigFile = addConfigFile;
let initialized = false;
function initEnv(type, options) {
    if (initialized) {
        return;
    }
    initialized = true;
    if (options.platform === 'mp-360') {
        console.error(uni_cli_shared_1.M['mp.360.unsupported']);
        process.exit(0);
    }
    if (options.plugin) {
        process.env.UNI_MP_PLUGIN = 'true';
    }
    // TODO 需要识别 mode
    if (type === 'dev') {
        process.env.NODE_ENV = 'development';
    }
    else if (type === 'build') {
        if (options.watch) {
            process.env.NODE_ENV = 'development';
        }
        else {
            process.env.NODE_ENV = 'production';
        }
    }
    if (!options.mode) {
        options.mode = process.env.NODE_ENV;
    }
    // vite 会修改 NODE_ENV，存储在 UNI_NODE_ENV 中，稍后校正 NODE_ENV
    process.env.UNI_NODE_ENV = process.env.VITE_USER_NODE_ENV =
        process.env.NODE_ENV;
    process.env.UNI_CLI_CONTEXT = (0, uni_cli_shared_1.isInHBuilderX)()
        ? path_1.default.resolve(process.env.UNI_HBUILDERX_PLUGINS, 'uniapp-cli-vite')
        : process.cwd();
    // TODO 待优化
    initUTSPlatform(options);
    if (options.platform === 'quickapp-webview-huawei' ||
        options.platform === 'quickapp-webview-union') {
        process.env.UNI_SUB_PLATFORM = options.platform;
        options.platform = 'quickapp-webview';
    }
    process.env.VITE_ROOT_DIR =
        process.env.VITE_ROOT_DIR || process.env.UNI_INPUT_DIR || process.cwd();
    process.env.UNI_INPUT_DIR =
        process.env.UNI_INPUT_DIR || path_1.default.resolve(process.cwd(), 'src');
    initCustomScripts(options);
    process.env.UNI_PLATFORM = options.platform;
    const hasOutputDir = !!process.env.UNI_OUTPUT_DIR;
    if (hasOutputDir) {
        ;
        options.outDir = process.env.UNI_OUTPUT_DIR;
    }
    else {
        if (!options.outDir) {
            ;
            options.outDir = path_1.default.resolve(process.cwd(), 'dist', process.env.NODE_ENV === 'production' ? 'build' : 'dev', (0, uni_cli_shared_1.getPlatformDir)());
        }
        process.env.UNI_OUTPUT_DIR = options.outDir;
    }
    // 兼容 HBuilderX 旧参数
    if (process.env.UNI_SUBPACKGE) {
        options.subpackage = process.env.UNI_SUBPACKGE;
    }
    if (options.subpackage) {
        process.env.UNI_SUBPACKAGE = options.subpackage;
        if (!hasOutputDir) {
            // 未指定，则自动补充
            process.env.UNI_OUTPUT_DIR = options.outDir =
                path_1.default.resolve(process.env.UNI_OUTPUT_DIR, options.subpackage);
        }
    }
    initAutomator(options);
    initDevtools(options);
    if (process.env.UNI_PLATFORM === 'app') {
        const pkg = require('../../package.json');
        console.log(uni_cli_shared_1.M['app.compiler.version'].replace('{version}', pkg['uni-app']['compilerVersion'] + '（vue3）'));
        (0, nvue_1.initNVueEnv)();
    }
    if (process.env.NODE_ENV === 'development') {
        console.log(uni_cli_shared_1.M['dev.performance'] +
            (process.env.UNI_PLATFORM.startsWith('mp-')
                ? uni_cli_shared_1.M['dev.performance.mp']
                : ''));
    }
    if (options.sourcemap &&
        process.env.NODE_ENV === 'production') {
        process.env.SOURCEMAP = 'true';
    }
    (0, uni_cli_shared_1.initModulePaths)();
    console.log(uni_cli_shared_1.M['compiling']);
}
exports.initEnv = initEnv;
function initUTSPlatform(options) {
    if (options.platform === 'app-android') {
        process.env.UNI_UTS_PLATFORM = 'app-android';
        options.platform = 'app';
    }
    else if (options.platform === 'app-ios') {
        process.env.UNI_UTS_PLATFORM = 'app-ios';
        options.platform = 'app';
    }
    else {
        // 运行时，可能传入了 UNI_APP_PLATFORM = 'android'|'ios'
        if (process.env.UNI_APP_PLATFORM === 'android') {
            process.env.UNI_UTS_PLATFORM = 'app-android';
        }
        if (process.env.UNI_APP_PLATFORM === 'ios') {
            process.env.UNI_UTS_PLATFORM = 'app-ios';
        }
        if (options.platform === 'app-plus') {
            options.platform = 'app';
        }
    }
    if (options.platform === 'h5') {
        process.env.UNI_UTS_PLATFORM = 'web';
    }
    // 非 app 平台，自动补充 UNI_UTS_PLATFORM
    // app 平台，必须主动传入
    if (options.platform !== 'app') {
        if (!process.env.UNI_UTS_PLATFORM) {
            process.env.UNI_UTS_PLATFORM = options.platform;
        }
    }
}
function initDevtools({ devtools, devtoolsHost, devtoolsPort }) {
    if (!devtools) {
        return;
    }
    process.env.__VUE_PROD_DEVTOOLS__ = 'true';
    if (devtoolsHost) {
        process.env.__VUE_DEVTOOLS_HOST__ = devtoolsHost;
    }
    if (devtoolsPort) {
        process.env.__VUE_DEVTOOLS_PORT__ = devtoolsPort + '';
    }
}
function initAutomator({ autoHost, autoPort }) {
    // 发行分包,插件也不需要自动化测试
    if (!autoPort || process.env.UNI_SUBPACKAGE || process.env.UNI_MP_PLUGIN) {
        return;
    }
    process.env.UNI_AUTOMATOR_WS_ENDPOINT =
        'ws://' + (autoHost || resolveHostname()) + ':' + autoPort;
}
function resolveHostname() {
    const interfaces = os_1.default.networkInterfaces();
    const keys = Object.keys(interfaces);
    for (const key of keys) {
        const interfaceInfos = interfaces[key];
        if (!interfaceInfos) {
            continue;
        }
        for (const info of interfaceInfos) {
            if ((info.family === 'IPv4' ||
                /* Node >= v18 */ info.family === 4) &&
                !info.address.includes('127.0.0.1')) {
                return info.address;
            }
        }
    }
    return 'localhost';
}
function cleanOptions(options) {
    const ret = { ...options };
    delete ret['--'];
    delete ret.c;
    delete ret.config;
    delete ret.platform;
    delete ret.p;
    delete ret.ssr;
    delete ret.base;
    delete ret.debug;
    delete ret.d;
    delete ret.filter;
    delete ret.f;
    delete ret.logLevel;
    delete ret.l;
    delete ret.clearScreen;
    delete ret.m;
    delete ret.mode;
    delete ret.autoHost;
    delete ret.autoPort;
    return ret;
}
exports.cleanOptions = cleanOptions;
function printStartupDuration(logger, whitespace = true) {
    // @ts-ignore
    if (global.__vite_start_time) {
        // @ts-ignore
        const startupDuration = perf_hooks_1.performance.now() - global.__vite_start_time;
        logger.info(`${whitespace ? `\n  ` : ''}${picocolors_1.default.cyan(`ready in ${Math.ceil(startupDuration)}ms.`)}\n`);
    }
}
exports.printStartupDuration = printStartupDuration;
function initCustomScripts(options) {
    const custom = (0, uni_cli_shared_1.parseScripts)(process.env.UNI_SCRIPT || options.platform, // process.env.UNI_SCRIPT 是 HBuilderX 传递的
    path_1.default.join(process.env.VITE_ROOT_DIR, 'package.json'));
    if (!custom) {
        return;
    }
    options.platform = custom.platform;
    process.env.UNI_CUSTOM_SCRIPT = custom.name;
    process.env.UNI_CUSTOM_DEFINE = JSON.stringify(custom.define);
    process.env.UNI_CUSTOM_CONTEXT = JSON.stringify(custom.context);
}
