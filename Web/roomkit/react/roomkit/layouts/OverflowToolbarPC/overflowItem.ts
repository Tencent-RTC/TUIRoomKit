import { createContext } from 'react';
import type { ComponentType } from 'react';
import type { IconProps } from '../../base';

export interface OverflowSubmenuItem {
  command?: string;
  label?: string;
  icon?: ComponentType<IconProps>;
  disabled?: boolean;
  checked?: boolean;
  divider?: boolean;
}

/** Menu the overflow control paints in place when a collapsed toolbar item is drilled into. */
export interface OverflowSubmenu {
  title: string;
  /** Optional line under the title, e.g. why the items below are unavailable. */
  note?: string;
  items: OverflowSubmenuItem[];
  /** Returns whether the overflow menu should close after the command. */
  run: (command: string) => boolean;
}

/**
 * What a collapsed toolbar control does when picked from the more menu: run an action, or
 * drill into a submenu. A control that passes none falls back to its own click.
 */
export type OverflowBehavior =
  | { select: () => unknown }
  | { submenu: OverflowSubmenu };

/** A toolbar control as the more menu shows it once it collapses. */
export interface OverflowItem {
  label: string;
  icon?: ComponentType<IconProps>;
  disabled?: boolean;
  behavior: OverflowBehavior;
}

/** A registered control: its root lets the toolbar match it to the slot child that holds it. */
export interface RegisteredOverflowItem extends OverflowItem {
  el: HTMLElement;
}

/** A collapsed slot child as the more menu renders it; the id stays with the child. */
export interface OverflowMenuEntry extends OverflowItem {
  id: string;
}

export interface OverflowItemRegistry {
  /** Adds a control read through `source` whenever the toolbar renders; returns the unregister. */
  register: (source: () => RegisteredOverflowItem | null) => () => void;
  /** A control's fields changed, so the more menu has to render again. */
  refresh: () => void;
}

/** Provided by OverflowToolbarPC; ToolbarButtonPC registers through it when it has one. */
export const OVERFLOW_ITEM_KEY = createContext<OverflowItemRegistry | null>(null);
