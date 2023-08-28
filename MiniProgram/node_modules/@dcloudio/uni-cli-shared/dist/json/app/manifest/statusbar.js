"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAppStatusbar = void 0;
function initAppStatusbar(manifestJson, pagesJson) {
    const titleColor = pagesJson.pages[0].style.navigationBar.titleColor ||
        pagesJson.globalStyle.navigationBar.titleColor ||
        '#ffffff';
    const backgroundColor = pagesJson.globalStyle.navigationBar.backgroundColor || '#000000';
    manifestJson.plus.statusbar = {
        immersed: 'supportedDevice',
        style: titleColor === '#000000' ? 'dark' : 'light',
        background: backgroundColor,
    };
    return manifestJson;
}
exports.initAppStatusbar = initAppStatusbar;
