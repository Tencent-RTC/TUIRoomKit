"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformUTSComponent = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const utils_1 = require("../../utils");
/**
 * 将uts组件保存到自定义组件列表中
 * @param node
 * @param context
 * @returns
 */
const transformUTSComponent = (node, context) => {
    if (!(0, uni_cli_shared_1.isElementNode)(node)) {
        return;
    }
    if ((0, utils_1.isUTSComponent)(node.tag)) {
        if (!context.root.components.includes(node.tag)) {
            context.components.add(node.tag);
        }
    }
};
exports.transformUTSComponent = transformUTSComponent;
