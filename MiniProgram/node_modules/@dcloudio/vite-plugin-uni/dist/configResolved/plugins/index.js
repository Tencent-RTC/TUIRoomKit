"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPlugins = void 0;
const path_1 = __importDefault(require("path"));
const debug_1 = __importDefault(require("debug"));
const shared_1 = require("@vue/shared");
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const pre_1 = require("./pre");
const json_1 = require("./json");
const preCss_1 = require("./preCss");
const static_1 = require("./static");
const preVue_1 = require("./preVue");
const ssr_1 = require("./ssr");
const resolveId_1 = require("./resolveId");
const debugPlugin = (0, debug_1.default)('uni:plugin');
const UNI_H5_RE = /@dcloudio\/uni-h5/;
const uniPrePluginOptions = {
    exclude: [...uni_cli_shared_1.COMMON_EXCLUDE, UNI_H5_RE],
};
const uniPreCssPluginOptions = {
    exclude: [...uni_cli_shared_1.COMMON_EXCLUDE, UNI_H5_RE],
};
function initPlugins(config, options) {
    const plugins = config.plugins;
    addPlugin(plugins, (0, resolveId_1.uniResolveIdPlugin)(options), 'vite:resolve', 'pre');
    addPlugin(plugins, (0, pre_1.uniPrePlugin)(config, (0, shared_1.extend)(uniPrePluginOptions, options)), 0, 'pre');
    addPlugin(plugins, (0, preCss_1.uniPreCssPlugin)(config, (0, shared_1.extend)(uniPreCssPluginOptions, options)), 'vite:css');
    addPlugin(plugins, (0, preVue_1.uniPreVuePlugin)(), 'vite:vue', 'pre');
    addPlugin(plugins, (0, ssr_1.uniSSRPlugin)(config, (0, shared_1.extend)({ exclude: [...uni_cli_shared_1.COMMON_EXCLUDE] }, options)), 'vite:vue');
    addPlugin(plugins, (0, json_1.uniJsonPlugin)(options), 'vite:json', 'pre');
    addPlugin(plugins, (0, static_1.uniStaticPlugin)(options, config), 'vite:asset', 'pre');
    if ((0, uni_cli_shared_1.isInHBuilderX)()) {
        try {
            require(path_1.default.resolve(process.env.UNI_HBUILDERX_PLUGINS, 'uni_helpers/lib/bytenode'));
            const { V } = require(path_1.default.join(process.env.UNI_HBUILDERX_PLUGINS, 'uni_helpers'));
            addPlugin(plugins, V({ dir: process.env.UNI_INPUT_DIR }), 0, 'pre');
        }
        catch (e) { }
    }
    if (process.env.DEBUG) {
        debugPlugin(plugins.length);
        debugPlugin(plugins.map((p) => p.name));
    }
}
exports.initPlugins = initPlugins;
function addPlugin(plugins, plugin, index, type = 'post') {
    if ((0, shared_1.isString)(index)) {
        index = plugins.findIndex((plugin) => plugin.name === index);
    }
    return plugins.splice(index + (type === 'pre' ? 0 : 1), 0, plugin);
}
