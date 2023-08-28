"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformManifestJsonOnce = exports.getDevServerOptions = exports.isEnableTreeShaking = exports.getRouterOptions = exports.isUniPushOffline = exports.isEnableSecureNetwork = exports.isEnableUniPushV2 = exports.isEnableUniPushV1 = exports.getUniStatistics = exports.normalizeNetworkTimeout = exports.parseCompatConfigOnce = exports.parseRpx2UnitOnce = exports.parseManifestJsonOnce = exports.parseManifestJson = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const shared_1 = require("@vue/shared");
const uni_shared_1 = require("@dcloudio/uni-shared");
const json_1 = require("./json");
const parseManifestJson = (inputDir) => {
    return (0, json_1.parseJson)(fs_1.default.readFileSync(path_1.default.join(inputDir, 'manifest.json'), 'utf8'));
};
exports.parseManifestJson = parseManifestJson;
exports.parseManifestJsonOnce = (0, uni_shared_1.once)(exports.parseManifestJson);
exports.parseRpx2UnitOnce = (0, uni_shared_1.once)((inputDir, platform = 'h5') => {
    const rpx2unit = platform === 'h5' || platform === 'app'
        ? uni_shared_1.defaultRpx2Unit
        : uni_shared_1.defaultMiniProgramRpx2Unit;
    const platformOptions = (0, exports.parseManifestJsonOnce)(inputDir)[platform];
    if (platformOptions && platformOptions.rpx) {
        return (0, shared_1.extend)({}, rpx2unit, platformOptions);
    }
    return (0, shared_1.extend)({}, rpx2unit);
});
function parseCompatConfig(_inputDir) {
    // 不支持 mode:2
    return { MODE: 3 }; //parseManifestJsonOnce(inputDir).compatConfig || {}
}
exports.parseCompatConfigOnce = (0, uni_shared_1.once)(parseCompatConfig);
const defaultNetworkTimeout = {
    request: 60000,
    connectSocket: 60000,
    uploadFile: 60000,
    downloadFile: 60000,
};
function normalizeNetworkTimeout(networkTimeout) {
    return {
        ...defaultNetworkTimeout,
        ...networkTimeout,
    };
}
exports.normalizeNetworkTimeout = normalizeNetworkTimeout;
function getUniStatistics(inputDir, platform) {
    const manifest = (0, exports.parseManifestJsonOnce)(inputDir);
    if (platform === 'app') {
        platform = 'app-plus';
    }
    return (0, shared_1.extend)({}, manifest.uniStatistics, manifest[platform] && manifest[platform].uniStatistics);
}
exports.getUniStatistics = getUniStatistics;
function isEnableUniPushV1(inputDir, platform) {
    if (isEnableUniPushV2(inputDir, platform)) {
        return false;
    }
    const manifest = (0, exports.parseManifestJsonOnce)(inputDir);
    if (platform === 'app') {
        const push = manifest['app-plus']?.distribute?.sdkConfigs?.push;
        if (push && (0, shared_1.hasOwn)(push, 'unipush')) {
            return true;
        }
    }
    return false;
}
exports.isEnableUniPushV1 = isEnableUniPushV1;
function isEnableUniPushV2(inputDir, platform) {
    const manifest = (0, exports.parseManifestJsonOnce)(inputDir);
    if (platform === 'app') {
        return (manifest['app-plus']?.distribute?.sdkConfigs?.push?.unipush?.version ==
            '2');
    }
    return manifest[platform]?.unipush?.enable === true;
}
exports.isEnableUniPushV2 = isEnableUniPushV2;
function isEnableSecureNetwork(inputDir, platform) {
    const manifest = (0, exports.parseManifestJsonOnce)(inputDir);
    if (platform === 'app') {
        return !!manifest['app-plus']?.modules?.SecureNetwork;
    }
    return manifest[platform]?.secureNetwork?.enable === true;
}
exports.isEnableSecureNetwork = isEnableSecureNetwork;
function isUniPushOffline(inputDir) {
    const manifest = (0, exports.parseManifestJsonOnce)(inputDir);
    return (manifest['app-plus']?.distribute?.sdkConfigs?.push?.unipush?.offline ===
        true);
}
exports.isUniPushOffline = isUniPushOffline;
function getRouterOptions(manifestJson) {
    return (0, shared_1.extend)({}, manifestJson.h5?.router);
}
exports.getRouterOptions = getRouterOptions;
function isEnableTreeShaking(manifestJson) {
    return manifestJson.h5?.optimization?.treeShaking?.enable !== false;
}
exports.isEnableTreeShaking = isEnableTreeShaking;
function getDevServerOptions(manifestJson) {
    return (0, shared_1.extend)({}, manifestJson.h5?.devServer);
}
exports.getDevServerOptions = getDevServerOptions;
function getPlatformManifestJsonOnce() {
    const platform = process.env.UNI_PLATFORM === 'app' ? 'app-plus' : process.env.UNI_PLATFORM;
    return !process.env.UNI_INPUT_DIR
        ? {}
        : (0, exports.parseManifestJsonOnce)(process.env.UNI_INPUT_DIR)[platform] || {};
}
exports.getPlatformManifestJsonOnce = getPlatformManifestJsonOnce;
