"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformTag = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const transformTag = (node, _) => {
    if (!(0, uni_cli_shared_1.isElementNode)(node)) {
        return;
    }
    const newTag = uni_cli_shared_1.HTML_TO_MINI_PROGRAM_TAGS[node.tag];
    if (newTag) {
        node.tag = newTag;
        node.tagType = 0 /* ElementTypes.ELEMENT */;
    }
};
exports.transformTag = transformTag;
