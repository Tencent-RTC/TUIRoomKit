import { ComponentNode, DirectiveNode, ElementNode } from '@vue/compiler-core';
import { NodeTransform, TransformContext } from '../transform';
export declare const transformComponent: NodeTransform;
/**
 * 重写组件 props 绑定
 * @param node
 * @param context
 */
export declare function rewriteBinding({ tag, props }: ComponentNode, context: TransformContext): void;
export declare function isPropsBinding({ arg }: DirectiveNode): boolean | undefined;
export declare function rewritePropsBinding(dir: DirectiveNode, node: ElementNode, context: TransformContext): void;
