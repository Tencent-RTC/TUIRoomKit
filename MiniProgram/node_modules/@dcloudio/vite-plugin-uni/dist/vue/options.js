"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPluginViteLegacyOptions = exports.initPluginVueJsxOptions = exports.initPluginVueOptions = exports.createPluginVueInstance = void 0;
const shared_1 = require("@vue/shared");
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const utils_1 = require("../utils");
const pluginVuePath = require.resolve('@vitejs/plugin-vue');
const normalizedPluginVuePath = (0, uni_cli_shared_1.normalizePath)(pluginVuePath);
/**
 * 每次创建新的 plugin-vue 实例。因为该插件内部会 cache  descriptor，而相同的vue文件在编译到vue页面和nvue页面时，不能共享缓存（条件编译，css scoped等均不同）
 * @returns
 */
function createPluginVueInstance(options) {
    delete require.cache[pluginVuePath];
    delete require.cache[normalizedPluginVuePath];
    const vuePlugin = require('@vitejs/plugin-vue');
    return vuePlugin(options);
}
exports.createPluginVueInstance = createPluginVueInstance;
function initPluginVueOptions(options, UniVitePlugins, uniPluginOptions) {
    const vueOptions = options.vueOptions || (options.vueOptions = {});
    // if (!hasOwn(vueOptions, 'reactivityTransform')) {
    //   vueOptions.reactivityTransform = true
    // }
    if (!vueOptions.include) {
        vueOptions.include = [];
    }
    if (!(0, shared_1.isArray)(vueOptions.include)) {
        vueOptions.include = [vueOptions.include];
    }
    vueOptions.include.push(uni_cli_shared_1.EXTNAME_VUE_RE);
    const styleOptions = vueOptions.style || (vueOptions.style = {});
    if (!styleOptions.postcssPlugins) {
        styleOptions.postcssPlugins = [];
    }
    // 解析 scoped 中 deep 等特殊语法
    styleOptions.postcssPlugins.push((0, uni_cli_shared_1.uniPostcssScopedPlugin)());
    const templateOptions = vueOptions.template || (vueOptions.template = {});
    const compilerOptions = templateOptions.compilerOptions || (templateOptions.compilerOptions = {});
    const { compiler, styleOptions: { postcssPlugins }, compilerOptions: { miniProgram, isNativeTag, isCustomElement, nodeTransforms, directiveTransforms, }, } = uniPluginOptions;
    if (postcssPlugins) {
        styleOptions.postcssPlugins.push(...postcssPlugins);
    }
    if (compiler) {
        templateOptions.compiler = compiler;
    }
    if (miniProgram) {
        ;
        compilerOptions.miniProgram = miniProgram;
    }
    if (isNativeTag) {
        const userIsNativeTag = compilerOptions.isNativeTag;
        compilerOptions.isNativeTag = (tag) => {
            if (isNativeTag(tag)) {
                return true;
            }
            if (userIsNativeTag && userIsNativeTag(tag)) {
                return true;
            }
            return false;
        };
    }
    if (isCustomElement) {
        const userIsCustomElement = compilerOptions.isCustomElement;
        compilerOptions.isCustomElement = (tag) => {
            if (isCustomElement(tag)) {
                return true;
            }
            if (userIsCustomElement && userIsCustomElement(tag)) {
                return true;
            }
            return false;
        };
    }
    compilerOptions.directiveTransforms = {
        ...compilerOptions.directiveTransforms,
        ...directiveTransforms,
    };
    if (!compilerOptions.nodeTransforms) {
        compilerOptions.nodeTransforms = [];
    }
    if (options.platform === 'h5') {
        templateOptions.transformAssetUrls = (0, uni_cli_shared_1.createUniVueTransformAssetUrls)((0, uni_cli_shared_1.isExternalUrl)(options.base) ? options.base : '');
    }
    else {
        // 替换内置的 transformAssetUrls 逻辑
        templateOptions.transformAssetUrls = {
            tags: {},
        };
        compilerOptions.nodeTransforms.push(...(0, uni_cli_shared_1.getBaseNodeTransforms)(options.base));
    }
    if (nodeTransforms) {
        compilerOptions.nodeTransforms.push(...nodeTransforms);
    }
    // const compatConfig = parseCompatConfigOnce(options.inputDir)
    // compilerOptions.compatConfig = extend(
    //   compilerOptions.compatConfig || {},
    //   compatConfig
    // )
    // App,MP 平台不支持使用静态节点
    compilerOptions.hoistStatic = false;
    compilerOptions.root = process.env.UNI_INPUT_DIR;
    // app-nvue 需要启用 customElement 机制来内联 styles
    if (process.env.UNI_COMPILER === 'nvue') {
        vueOptions.customElement = true;
        if (process.env.UNI_RENDERER_NATIVE !== 'appService') {
            // nvue 需要使用自己的 compiler，来移除 scoped
            vueOptions.compiler = (0, utils_1.createNVueCompiler)();
        }
    }
    return vueOptions;
}
exports.initPluginVueOptions = initPluginVueOptions;
function initPluginVueJsxOptions(options, { isCustomElement, }, jsxOptions) {
    const vueJsxOptions = (0, shared_1.isPlainObject)(options.vueJsxOptions)
        ? options.vueJsxOptions
        : (options.vueJsxOptions = {});
    if (!(0, shared_1.hasOwn)(vueJsxOptions, 'optimize')) {
        vueJsxOptions.optimize = true;
    }
    vueJsxOptions.isCustomElement = isCustomElement;
    if (!vueJsxOptions.babelPlugins) {
        vueJsxOptions.babelPlugins = [];
    }
    if ((0, shared_1.isArray)(jsxOptions.babelPlugins)) {
        vueJsxOptions.babelPlugins.push(...jsxOptions.babelPlugins);
    }
    return vueJsxOptions;
}
exports.initPluginVueJsxOptions = initPluginVueJsxOptions;
function initPluginViteLegacyOptions(options) {
    const viteLegacyOptions = options.viteLegacyOptions || (options.viteLegacyOptions = {});
    return viteLegacyOptions;
}
exports.initPluginViteLegacyOptions = initPluginViteLegacyOptions;
