"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformPageHead = void 0;
const utils_1 = require("../../utils");
const transformPageHead = (node, context) => {
    // 发现是page-meta下的head,直接remove该节点
    (0, utils_1.checkElementNodeTag)(node, 'head') &&
        (0, utils_1.checkElementNodeTag)(context.parent, 'page-meta') &&
        context.removeNode(node);
};
exports.transformPageHead = transformPageHead;
