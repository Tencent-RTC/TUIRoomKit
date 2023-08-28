import { DirectiveNode, AttributeNode } from '@vue/compiler-core';
import { TransformContext } from '../transform';
export declare function isStyleBinding({ arg, exp }: DirectiveNode): boolean | undefined;
export declare function findStaticStyleIndex(props: (AttributeNode | DirectiveNode)[]): number;
export declare function rewriteStyle(index: number, styleBindingProp: DirectiveNode, props: (AttributeNode | DirectiveNode)[], virtualHost: boolean, context: TransformContext): void;
export declare function createVirtualHostStyle(props: (AttributeNode | DirectiveNode)[], context: TransformContext): DirectiveNode;
