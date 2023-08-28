"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSsr = exports.isInHybridNVue = exports.withSourcemap = void 0;
function withSourcemap(config) {
    if (config.command === 'serve') {
        return true;
    }
    return !!config.build.sourcemap;
}
exports.withSourcemap = withSourcemap;
function isInHybridNVue(config) {
    return config.nvue && process.env.UNI_RENDERER !== 'native';
}
exports.isInHybridNVue = isInHybridNVue;
function isSsr(command, config) {
    if (command === 'serve') {
        return !!(config.server && config.server.middlewareMode);
    }
    if (command === 'build') {
        return !!(config.build && config.build.ssr);
    }
    return false;
}
exports.isSsr = isSsr;
