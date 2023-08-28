"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniCopyPlugin = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const debug_1 = __importDefault(require("debug"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const debugCopy = (0, debug_1.default)('uni:copy');
function uniCopyPlugin({ outputDir, copyOptions, }) {
    const staticDir = uni_cli_shared_1.PUBLIC_DIR + '/**/*';
    const uniModulesStaticDir = 'uni_modules/*/' + uni_cli_shared_1.PUBLIC_DIR + '/**/*';
    const assets = [staticDir, uniModulesStaticDir];
    const subpackages = (0, uni_cli_shared_1.parseSubpackagesRootOnce)(process.env.UNI_INPUT_DIR, process.env.UNI_PLATFORM);
    subpackages.forEach((root) => {
        assets.push((0, uni_cli_shared_1.normalizePath)(path_1.default.join(root, staticDir)));
        assets.push((0, uni_cli_shared_1.normalizePath)(path_1.default.join(root, uniModulesStaticDir)));
    });
    copyOptions.assets.forEach((asset) => {
        assets.push(asset);
    });
    const platform = process.env.UNI_PLATFORM;
    // 非当前平台 static 目录
    const ignorePlatformStaticDirs = (0, uni_cli_shared_1.getPlatforms)()
        .filter((p) => {
        if (platform === 'app') {
            return p !== 'app' && p !== 'app-plus';
        }
        return p !== platform;
    })
        .map((p) => '/' + uni_cli_shared_1.PUBLIC_DIR + '/' + p);
    const targets = [
        {
            src: assets,
            dest: outputDir,
            watchOptions: {
                ignored(path) {
                    const normalizedPath = (0, uni_cli_shared_1.normalizePath)(path);
                    if (ignorePlatformStaticDirs.find((dir) => normalizedPath.includes(dir))) {
                        return fs_1.default.statSync(normalizedPath).isDirectory();
                    }
                    return false;
                },
            },
        },
    ];
    targets.push(...copyOptions.targets);
    debugCopy(targets);
    return (0, uni_cli_shared_1.uniViteCopyPlugin)({
        targets,
        verbose: process.env.DEBUG ? true : false,
    });
}
exports.uniCopyPlugin = uniCopyPlugin;
