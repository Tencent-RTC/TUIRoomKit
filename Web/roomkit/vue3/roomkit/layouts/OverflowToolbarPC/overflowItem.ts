import type { Component, InjectionKey } from 'vue';

export interface OverflowSubmenuItem {
  command?: string;
  label?: string;
  icon?: Component;
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
  icon?: Component;
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

export type RegisterOverflowItem = (source: () => RegisteredOverflowItem | null) => () => void;

/** Provided by OverflowToolbarPC; ToolbarButtonPC registers through it when it has one. */
export const OVERFLOW_ITEM_KEY: InjectionKey<RegisterOverflowItem | null> = Symbol('rk-overflow-item');
