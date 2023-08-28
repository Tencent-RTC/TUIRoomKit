"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransformComponentLink = void 0;
const compiler_core_1 = require("@vue/compiler-core");
const utils_1 = require("../utils");
function createTransformComponentLink(name, type = 7 /* NodeTypes.DIRECTIVE */) {
    return function transformComponentLink(node, context) {
        if (!(0, utils_1.isUserComponent)(node, context)) {
            return;
        }
        if (type === 7 /* NodeTypes.DIRECTIVE */) {
            node.props.push({
                type: 7 /* NodeTypes.DIRECTIVE */,
                name: 'on',
                modifiers: [],
                loc: compiler_core_1.locStub,
                arg: (0, compiler_core_1.createSimpleExpression)(name, true),
                exp: (0, compiler_core_1.createSimpleExpression)('__l', true),
            });
        }
        else {
            node.props.push((0, utils_1.createAttributeNode)(name, '__l'));
        }
    };
}
exports.createTransformComponentLink = createTransformComponentLink;
