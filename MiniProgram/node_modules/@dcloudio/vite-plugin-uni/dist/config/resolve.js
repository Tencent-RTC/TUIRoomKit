"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResolve = exports.customResolver = void 0;
const path_1 = __importDefault(require("path"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function resolveUTSModuleProxyFile(id, importer) {
    const file = (0, uni_cli_shared_1.resolveUTSAppModule)(id, importer);
    if (file) {
        return file + '?uts-proxy';
    }
}
const customResolver = (updatedId, importer) => {
    const utsImporter = importer
        ? path_1.default.dirname(importer)
        : process.env.UNI_INPUT_DIR;
    const utsModuleFile = process.env.UNI_PLATFORM === 'app'
        ? resolveUTSModuleProxyFile(updatedId, utsImporter)
        : (0, uni_cli_shared_1.resolveUTSModule)(updatedId, utsImporter);
    if (utsModuleFile) {
        return uni_cli_shared_1.isWindows ? (0, uni_cli_shared_1.normalizePath)(utsModuleFile) : utsModuleFile;
    }
    if (uni_cli_shared_1.isWindows) {
        return (0, uni_cli_shared_1.normalizePath)((0, uni_cli_shared_1.requireResolve)(updatedId, importer || process.env.UNI_INPUT_DIR));
    }
    return (0, uni_cli_shared_1.requireResolve)(updatedId, importer || process.env.UNI_INPUT_DIR);
};
exports.customResolver = customResolver;
function createResolve(options, _config) {
    return {
        // 必须使用alias解析，插件定制的resolveId，不会被应用到css等预处理器中
        alias: [
            // @ts-ignore because @rollup/plugin-alias' type doesn't allow function
            // replacement, but its implementation does work with function values.
            {
                find: /^(~@|@)\/(.*)/,
                replacement(_str, _$1, $2) {
                    return (0, uni_cli_shared_1.normalizePath)(path_1.default.resolve(options.inputDir, $2));
                },
                customResolver: exports.customResolver,
            },
        ],
        extensions: uni_cli_shared_1.extensions,
    };
}
exports.createResolve = createResolve;
