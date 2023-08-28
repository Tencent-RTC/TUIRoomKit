import { DirectiveNode } from '@vue/compiler-core';
import { ForElementNode } from './vFor';
export declare function isSelfKey({ arg, exp }: DirectiveNode, vFor: ForElementNode['vFor'] | false): boolean | undefined;
export declare function rewriteSelfKey(dir: DirectiveNode): void;
