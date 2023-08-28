"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTheme = exports.normalizeThemeConfigOnce = exports.parseThemeJson = exports.hasThemeJson = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const json_1 = require("./json");
const uni_shared_1 = require("@dcloudio/uni-shared");
function hasThemeJson(themeLocation) {
    if (!fs_1.default.existsSync(themeLocation)) {
        return false;
    }
    return true;
}
exports.hasThemeJson = hasThemeJson;
const parseThemeJson = (themeLocation = 'theme.json') => {
    if (!themeLocation || !process.env.UNI_INPUT_DIR) {
        return {};
    }
    themeLocation = path_1.default.join(process.env.UNI_INPUT_DIR, themeLocation);
    if (!hasThemeJson(themeLocation)) {
        return {};
    }
    const jsonStr = fs_1.default.readFileSync(themeLocation, 'utf8');
    return (0, json_1.parseJson)(jsonStr, true);
};
exports.parseThemeJson = parseThemeJson;
exports.normalizeThemeConfigOnce = (0, uni_shared_1.once)((manifestJsonPlatform = {}) => (0, exports.parseThemeJson)(manifestJsonPlatform.themeLocation));
function initTheme(manifestJson, pagesJson) {
    const platform = process.env.UNI_PLATFORM === 'app' ? 'app-plus' : process.env.UNI_PLATFORM;
    const manifestPlatform = manifestJson['plus'] || manifestJson[platform] || {};
    const themeConfig = (0, exports.normalizeThemeConfigOnce)(manifestPlatform);
    return (0, uni_shared_1.normalizeStyles)(pagesJson, themeConfig);
}
exports.initTheme = initTheme;
