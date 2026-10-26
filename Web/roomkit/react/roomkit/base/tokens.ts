import { createContext } from 'react';

export type OverlayLane = 'dropdown' | 'popover' | 'tooltip' | 'dialog' | 'toast';

export type Placement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

export interface OverlayHandle {
  id: number;
  zIndex: number;
}

export interface OverlayAcquireOptions {
  closeOnEsc?: boolean;
  onClose?: () => void;
}

export interface OverlayContext {
  /** Provider root element; `null` until the provider has mounted. */
  root: HTMLElement | null;
  /** Overlay stack element that portals render into; `null` until mounted. */
  host: HTMLElement | null;
  acquire: (lane: OverlayLane, options?: OverlayAcquireOptions) => OverlayHandle;
  release: (id: number) => void;
}

export interface SelectOptionRecord {
  value: string | number;
  label: string;
  disabled: boolean;
  el: HTMLElement | null;
}

export interface SelectContext {
  modelValue: string | number | null;
  register: (option: SelectOptionRecord) => void;
  unregister: (value: string | number) => void;
  select: (value: string | number) => void;
  highlighted: string | number | null;
}

export interface DropdownItemRecord {
  value: string | number;
  disabled?: boolean;
  el?: HTMLElement | null;
}

export interface DropdownContext {
  onCommand: (command: string | number) => void;
  close: () => void;
  register: (item: DropdownItemRecord) => void;
  unregister: (value: string | number) => void;
  highlighted: string | number | null;
  setHighlighted: (value: string | number | null) => void;
}

export const OVERLAY_CONTEXT_KEY = createContext<OverlayContext | null>(null);
export const SELECT_CONTEXT_KEY = createContext<SelectContext | null>(null);
export const DROPDOWN_CONTEXT_KEY = createContext<DropdownContext | null>(null);

export const LANE_BASE: Record<OverlayLane, number> = {
  dropdown: 20,
  popover: 30,
  tooltip: 40,
  dialog: 50,
  toast: 60,
};
