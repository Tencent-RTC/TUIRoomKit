"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResolveId = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function createResolveId(options) {
    const inputDir = (0, uni_cli_shared_1.normalizePath)(options.inputDir);
    return function (id) {
        if (id.startsWith('@/')) {
            return inputDir + id.slice(1);
        }
        else if (id.startsWith('~@/')) {
            return inputDir + id.slice(2);
        }
    };
}
exports.createResolveId = createResolveId;
