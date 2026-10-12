import { Comment, Fragment, Text } from 'vue';
import type { VNode } from 'vue';
import TUIOption from './Option.vue';

export interface SlotOption {
  value: string | number;
  label: string;
  disabled: boolean;
}

function flatten(nodes: VNode[]): VNode[] {
  const result: VNode[] = [];
  for (const node of nodes) {
    if (!node || node.type === Comment || node.type === Text) continue;
    if (node.type === Fragment && Array.isArray(node.children)) {
      result.push(...flatten(node.children as VNode[]));
      continue;
    }
    result.push(node);
  }
  return result;
}

function isOption(node: VNode) {
  const type = node.type as { name?: string; __name?: string } | string;
  if (type === TUIOption) return true;
  if (typeof type === 'object' && type) {
    return type.name === 'TUIOption' || type.__name === 'TUIOption';
  }
  return false;
}

function textOf(node: VNode): string {
  const children = node.children;
  if (typeof children === 'string') return children.trim();
  if (Array.isArray(children)) {
    return children.map((child) => {
      if (typeof child === 'string') return child;
      if (child && typeof child === 'object') return textOf(child as VNode);
      return '';
    }).join('').trim();
  }
  if (children && typeof children === 'object' && 'default' in children) {
    const next = (children as { default?: () => VNode[] }).default?.() ?? [];
    return next.map(textOf).join('').trim();
  }
  return '';
}

export function collectSelectOptions(nodes: VNode[]): SlotOption[] {
  return flatten(nodes).filter(isOption).map((node) => {
    const props = (node.props ?? {}) as Record<string, unknown>;
    const value = props.value as string | number;
    const label = (typeof props.label === 'string' && props.label)
      || textOf(node)
      || String(value ?? '');
    const disabled = props.disabled === '' || props.disabled === true;
    return { value, label, disabled };
  }).filter(item => item.value != null);
}
