"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBuild = exports.runDev = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const debug_1 = __importDefault(require("debug"));
const plugin_vue_jsx_1 = __importDefault(require("@vitejs/plugin-vue-jsx"));
const plugin_legacy_1 = __importDefault(require("@vitejs/plugin-legacy"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const config_1 = require("./config");
const configResolved_1 = require("./configResolved");
const copy_1 = require("./plugins/copy");
const move_1 = require("./plugins/move");
const utils_1 = require("./utils");
const vue_1 = require("./vue");
const utils_2 = require("./cli/utils");
const debugUni = (0, debug_1.default)('uni:plugin');
const pkg = require(path_1.default.resolve(__dirname, '../package.json'));
(0, uni_cli_shared_1.initModuleAlias)();
process.env.UNI_COMPILER_VERSION = pkg['uni-app']?.['compilerVersion'] || '';
process.env.UNI_COMPILER_VERSION_TYPE = pkg.version.includes('alpha')
    ? 'a'
    : 'r';
var action_1 = require("./cli/action");
Object.defineProperty(exports, "runDev", { enumerable: true, get: function () { return action_1.runDev; } });
Object.defineProperty(exports, "runBuild", { enumerable: true, get: function () { return action_1.runBuild; } });
let isFirst = true;
function uniPlugin(rawOptions = {}) {
    // 三方插件（如vitest）可能提供了自己的入口命令，需要补充 env 初始化逻辑
    (0, utils_2.initEnv)('unknown', { platform: process.env.UNI_PLATFORM || 'h5' });
    const options = {
        ...rawOptions,
        base: '/',
        assetsDir: 'assets',
        inputDir: '',
        outputDir: '',
        command: 'serve',
        platform: 'h5',
    };
    options.platform = process.env.UNI_PLATFORM || 'h5';
    options.inputDir = process.env.UNI_INPUT_DIR;
    (0, uni_cli_shared_1.initPreContext)(options.platform, process.env.UNI_CUSTOM_CONTEXT);
    const plugins = [];
    const injects = (0, uni_cli_shared_1.parseUniExtApis)();
    if (Object.keys(injects).length) {
        plugins.push((0, uni_cli_shared_1.uniViteInjectPlugin)('uni:ext-api-inject', injects));
    }
    // 仅限 h5
    if (options.viteLegacyOptions && options.platform === 'h5') {
        plugins.push(...(0, plugin_legacy_1.default)((0, vue_1.initPluginViteLegacyOptions)(options)));
    }
    const uniPlugins = (0, utils_1.initExtraPlugins)(process.env.UNI_CLI_CONTEXT || process.cwd(), process.env.UNI_PLATFORM || 'h5', options);
    debugUni(uniPlugins);
    const uniPluginOptions = (0, utils_1.initPluginUniOptions)(uniPlugins);
    options.copyOptions = uniPluginOptions.copyOptions;
    if (options.vueJsxOptions) {
        plugins.push((0, plugin_vue_jsx_1.default)((0, vue_1.initPluginVueJsxOptions)(options, uniPluginOptions.compilerOptions, uniPluginOptions.jsxOptions)));
    }
    plugins.push({
        name: 'uni',
        config: (0, config_1.createConfig)(options, uniPlugins),
        // resolveId: createResolveId(options),
        configResolved: (0, configResolved_1.createConfigResolved)(options),
    });
    plugins.push(...uniPlugins);
    plugins.push(...(0, utils_1.initFixedEsbuildInitTSConfck)(process.env.UNI_INPUT_DIR));
    // 执行 build 命令时，vite 强制了 NODE_ENV
    // https://github.com/vitejs/vite/blob/main/packages/vite/src/node/build.ts#L405
    // const config = await resolveConfig(inlineConfig, 'build', 'production')
    // 在 @vitejs/plugin-vue 之前校正回来
    if (process.env.UNI_NODE_ENV &&
        process.env.UNI_NODE_ENV !== process.env.NODE_ENV) {
        process.env.NODE_ENV = process.env.UNI_NODE_ENV;
    }
    plugins.unshift((0, vue_1.createPluginVueInstance)((0, vue_1.initPluginVueOptions)(options, uniPlugins, uniPluginOptions)));
    let addCopyPlugin = false;
    if (options.platform !== 'app') {
        addCopyPlugin = true;
    }
    else {
        // 仅在 vue 或 纯原生 App.vue 编译时做 copy
        if (process.env.UNI_COMPILER === 'vue' ||
            (process.env.UNI_RENDERER === 'native' &&
                process.env.UNI_RENDERER_NATIVE === 'appService')) {
            addCopyPlugin = true;
        }
    }
    if (addCopyPlugin) {
        plugins.push((0, copy_1.uniCopyPlugin)({
            outputDir: process.env.UNI_OUTPUT_DIR,
            copyOptions: options.copyOptions,
        }));
    }
    if (process.env.SOURCEMAP === 'true') {
        // 清空之前的 sourcemap 目录
        const sourceMapPath = (0, uni_cli_shared_1.resolveSourceMapPath)();
        if (isFirst) {
            // 避免重复清空
            isFirst = false;
            if (fs_1.default.existsSync(sourceMapPath)) {
                (0, uni_cli_shared_1.emptyDir)(sourceMapPath);
            }
        }
        plugins.push((0, move_1.uniMovePlugin)({
            apply: 'build',
            enforce: 'post',
            cwd: process.env.UNI_OUTPUT_DIR,
            pattern: '**/*.js.map',
            dest: sourceMapPath,
        }));
    }
    (0, utils_1.rewriteCompilerSfcParse)();
    return plugins;
}
exports.default = uniPlugin;
