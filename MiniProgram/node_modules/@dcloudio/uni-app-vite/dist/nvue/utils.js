"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUTSComponent = exports.esbuildGlobals = exports.globals = exports.external = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function external(appService) {
    return appService ? ['vue'] : ['vue', 'vuex', 'pinia'];
}
exports.external = external;
function globals(appService) {
    return appService
        ? { vue: 'Vue' }
        : {
            vue: 'Vue',
            vuex: 'Vuex',
            pinia: 'Pinia',
        };
}
exports.globals = globals;
function esbuildGlobals(appService) {
    return appService
        ? { vue: 'Vue' }
        : {
            vue: 'Vue',
            vuex: 'uni.Vuex',
            pinia: 'uni.Pinia',
        };
}
exports.esbuildGlobals = esbuildGlobals;
function isUTSComponent(tag) {
    const source = (0, uni_cli_shared_1.matchEasycom)(tag);
    return !!(source && source.includes('uts-proxy'));
}
exports.isUTSComponent = isUTSComponent;
