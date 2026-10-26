import { Fragment, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

export function flattenVNodes(nodes: ReactNode): ReactElement[] {
  const result: ReactElement[] = [];
  const list: ReactNode[] = Array.isArray(nodes) ? nodes : [nodes];
  for (const node of list) {
    if (node == null || typeof node === 'boolean') continue;
    if (typeof node === 'string' || typeof node === 'number') continue;
    if (Array.isArray(node)) {
      result.push(...flattenVNodes(node));
      continue;
    }
    if (!isValidElement(node)) continue;
    if (node.type === Fragment) {
      result.push(...flattenVNodes((node.props as { children?: ReactNode }).children));
      continue;
    }
    result.push(node);
  }
  return result;
}
