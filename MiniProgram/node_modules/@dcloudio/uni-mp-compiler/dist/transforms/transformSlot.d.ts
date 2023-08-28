import { DirectiveNode, SlotOutletNode } from '@vue/compiler-core';
import { TransformContext } from '../transform';
export declare function rewriteSlot(node: SlotOutletNode, context: TransformContext): void;
export interface NameScopedSlotDirectiveNode extends DirectiveNode {
    slotName: string;
}
