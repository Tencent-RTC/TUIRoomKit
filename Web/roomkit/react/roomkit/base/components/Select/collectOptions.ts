import { Children, Fragment, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import TUIOption from './Option';

export interface SlotOption {
  value: string | number;
  label: string;
  disabled: boolean;
}

type AnyElement = ReactElement<Record<string, unknown>>;

function flatten(nodes: ReactNode): AnyElement[] {
  const result: AnyElement[] = [];
  Children.forEach(nodes, (node) => {
    if (!isValidElement(node)) return;
    const element = node as AnyElement;
    if (element.type === Fragment) {
      result.push(...flatten(element.props.children as ReactNode));
      return;
    }
    result.push(element);
  });
  return result;
}

function isOption(node: AnyElement) {
  const type = node.type as { name?: string; displayName?: string } | string;
  if (type === (TUIOption as unknown)) return true;
  if (typeof type === 'function' || (typeof type === 'object' && type)) {
    return type.name === 'TUIOption' || type.displayName === 'TUIOption';
  }
  return false;
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (Array.isArray(node)) {
    return node.map(textOf).join('').trim();
  }
  if (isValidElement(node)) {
    return textOf((node as AnyElement).props.children as ReactNode);
  }
  return '';
}

export function collectSelectOptions(nodes: ReactNode): SlotOption[] {
  return flatten(nodes).filter(isOption).map((node) => {
    const props = (node.props ?? {}) as Record<string, unknown>;
    const value = props.value as string | number;
    const label = (typeof props.label === 'string' && props.label)
      || textOf(props.children as ReactNode)
      || String(value ?? '');
    const disabled = props.disabled === true;
    return { value, label, disabled };
  }).filter(item => item.value != null);
}
