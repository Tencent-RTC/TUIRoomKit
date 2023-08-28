import { DirectiveNode, AttributeNode } from '@vue/compiler-core';
import { TransformContext } from '../transform';
export declare function isClassBinding({ arg }: DirectiveNode): boolean | undefined;
export declare function findStaticClassIndex(props: (AttributeNode | DirectiveNode)[]): number;
export declare function rewriteClass(index: number, classBindingProp: DirectiveNode, props: (AttributeNode | DirectiveNode)[], virtualHost: boolean, context: TransformContext): void;
export declare function createVirtualHostClass(props: (AttributeNode | DirectiveNode)[], context: TransformContext): DirectiveNode;
