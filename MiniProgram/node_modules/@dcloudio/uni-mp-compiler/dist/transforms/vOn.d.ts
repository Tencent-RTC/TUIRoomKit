import { DirectiveNode, ExpressionNode, SimpleExpressionNode, DirectiveTransform, ElementNode } from '@vue/compiler-core';
import { TransformContext } from '../transform';
export interface VOnDirectiveNode extends DirectiveNode {
    arg: ExpressionNode;
    exp: SimpleExpressionNode | undefined;
}
export declare const transformOn: DirectiveTransform;
export declare function wrapperVOn(value: ExpressionNode, node: ElementNode, context: TransformContext): ExpressionNode;
