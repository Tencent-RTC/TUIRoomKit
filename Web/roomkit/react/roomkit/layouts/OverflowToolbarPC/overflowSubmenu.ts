import type { ComponentType } from 'react';
import type { IconProps } from '../../base';

export interface OverflowSubmenuItem {
  act?: string;
  label?: string;
  icon?: ComponentType<IconProps>;
  disabled?: boolean;
  on?: boolean;
  divider?: boolean;
}

/** Menu the overflow control paints in place when a collapsed toolbar item is drilled into. */
export interface OverflowSubmenu {
  title: string;
  hint: string;
  items: OverflowSubmenuItem[];
  /** Returns whether the overflow menu should close after the action. */
  run: (act: string) => boolean;
}

export const OVERFLOW_SUBMENU_READY = 'overflow-submenu-ready';

type OverflowSubmenuSource = () => OverflowSubmenu;

const hosts = new WeakMap<HTMLElement, OverflowSubmenuSource>();

export function bindOverflowSubmenu(el: HTMLElement, source: OverflowSubmenuSource): () => void {
  hosts.set(el, source);
  el.dispatchEvent(new CustomEvent(OVERFLOW_SUBMENU_READY, { bubbles: true }));
  return () => {
    if (hosts.get(el) === source) {
      hosts.delete(el);
    }
  };
}

export function hasOverflowSubmenu(el: HTMLElement): boolean {
  return hosts.has(el);
}

export function readOverflowSubmenu(el: HTMLElement): OverflowSubmenu | null {
  const source = hosts.get(el);
  return source ? source() : null;
}
