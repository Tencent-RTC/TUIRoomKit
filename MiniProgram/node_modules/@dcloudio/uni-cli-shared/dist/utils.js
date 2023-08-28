"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installDepTips = exports.resolveSourceMapPath = exports.pathToGlob = exports.normalizeParsePlugins = exports.normalizeMiniProgramFilename = exports.normalizeNodeModules = exports.removeExt = exports.normalizePagePath = exports.normalizeIdentifier = exports.checkElementNodeTag = exports.normalizePath = exports.isWindows = exports.isRunningWithYarnPnp = exports.version = exports.hash = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const picocolors_1 = __importDefault(require("picocolors"));
const shared_1 = require("@vue/shared");
var hash_sum_1 = require("hash-sum");
Object.defineProperty(exports, "hash", { enumerable: true, get: function () { return __importDefault(hash_sum_1).default; } });
const constants_1 = require("./constants");
const platform_1 = require("./platform");
exports.version = require('../package.json').version;
try {
    exports.isRunningWithYarnPnp = Boolean(require('pnpapi'));
}
catch { }
exports.isWindows = os_1.default.platform() === 'win32';
function normalizePath(id) {
    return exports.isWindows ? id.replace(/\\/g, '/') : id;
}
exports.normalizePath = normalizePath;
function checkElementNodeTag(node, tag) {
    return !!node && node.type === 1 /* NodeTypes.ELEMENT */ && node.tag === tag;
}
exports.checkElementNodeTag = checkElementNodeTag;
function normalizeIdentifier(str) {
    return (0, shared_1.capitalize)((0, shared_1.camelize)(str.replace(/\//g, '-')));
}
exports.normalizeIdentifier = normalizeIdentifier;
function normalizePagePath(pagePath, platform) {
    const absolutePagePath = path_1.default.resolve(process.env.UNI_INPUT_DIR, pagePath);
    let extensions = constants_1.PAGE_EXTNAME;
    if (platform === 'app') {
        extensions = constants_1.PAGE_EXTNAME_APP;
    }
    for (let i = 0; i < extensions.length; i++) {
        const extname = extensions[i];
        if (fs_1.default.existsSync(absolutePagePath + extname)) {
            return pagePath + extname;
        }
    }
    console.error(`${pagePath} not found`);
}
exports.normalizePagePath = normalizePagePath;
function removeExt(str) {
    return str.split('?')[0].replace(/\.\w+$/g, '');
}
exports.removeExt = removeExt;
const NODE_MODULES_REGEX = /(\.\.\/)?node_modules/g;
function normalizeNodeModules(str) {
    str = normalizePath(str).replace(NODE_MODULES_REGEX, 'node-modules');
    // HBuilderX 内置模块路径转换
    str = str.replace(/.*\/plugins\/uniapp-cli-vite\/node[-_]modules/, 'node-modules');
    if (process.env.UNI_PLATFORM === 'mp-alipay') {
        str = str.replace('node-modules/@', 'node-modules/npm-scope-');
    }
    return str;
}
exports.normalizeNodeModules = normalizeNodeModules;
function normalizeMiniProgramFilename(filename, inputDir) {
    if (!inputDir || !path_1.default.isAbsolute(filename)) {
        return normalizeNodeModules(filename);
    }
    return normalizeNodeModules(path_1.default.relative(inputDir, filename));
}
exports.normalizeMiniProgramFilename = normalizeMiniProgramFilename;
function normalizeParsePlugins(importer, babelParserPlugins) {
    const isTS = constants_1.EXTNAME_TS_RE.test(importer.split('?')[0]);
    const plugins = [];
    if (isTS) {
        plugins.push('jsx');
    }
    if (babelParserPlugins)
        plugins.push(...babelParserPlugins);
    if (isTS)
        plugins.push('typescript', 'decorators-legacy');
    return plugins;
}
exports.normalizeParsePlugins = normalizeParsePlugins;
function pathToGlob(pathString, glob, options = {}) {
    const isWindows = 'windows' in options ? options.windows : /^win/.test(process.platform);
    const useEscape = options.escape;
    const str = isWindows ? pathString.replace(/\\/g, '/') : pathString;
    let safeStr = str.replace(/[\\*?[\]{}()!]/g, isWindows || !useEscape ? '[$&]' : '\\$&');
    return path_1.default.posix.join(safeStr, glob);
}
exports.pathToGlob = pathToGlob;
function resolveSourceMapPath(outputDir, platform) {
    return path_1.default.resolve(outputDir || process.env.UNI_OUTPUT_DIR, '../.sourcemap/' + (platform || (0, platform_1.getPlatformDir)()));
}
exports.resolveSourceMapPath = resolveSourceMapPath;
function hasProjectYarn(cwd) {
    return fs_1.default.existsSync(path_1.default.join(cwd, 'yarn.lock'));
}
function hasProjectPnpm(cwd) {
    return fs_1.default.existsSync(path_1.default.join(cwd, 'pnpm-lock.yaml'));
}
function getInstallCommand(cwd) {
    return hasProjectYarn(cwd)
        ? 'yarn add'
        : hasProjectPnpm(cwd)
            ? 'pnpm i'
            : 'npm i';
}
function installDepTips(type, module, version) {
    return `Cannot find module: ${module}
Please run \`${picocolors_1.default.cyan(`${getInstallCommand(process.cwd())} ${module + (version ? '@' + version : '')}${type === 'devDependencies' ? ' -D' : ''}`)}\` and try again.`;
}
exports.installDepTips = installDepTips;
