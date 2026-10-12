import { Comment, Fragment, Text } from 'vue';
import type { VNode } from 'vue';

export function flattenVNodes(nodes: VNode[]): VNode[] {
  const result: VNode[] = [];
  for (const node of nodes) {
    if (!node || node.type === Comment) continue;
    if (node.type === Text) continue;
    if (node.type === Fragment && Array.isArray(node.children)) {
      result.push(...flattenVNodes(node.children as VNode[]));
      continue;
    }
    result.push(node);
  }
  return result;
}
