import type { InjectionKey, Ref } from 'vue';

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
  root: Readonly<Ref<HTMLElement | null>>;
  host: Readonly<Ref<HTMLElement | null>>;
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
  modelValue: Ref<string | number | null>;
  register: (option: SelectOptionRecord) => void;
  unregister: (value: string | number) => void;
  select: (value: string | number) => void;
  highlighted: Ref<string | number | null>;
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
  highlighted: Ref<string | number | null>;
}

export const OVERLAY_CONTEXT_KEY: InjectionKey<OverlayContext> = Symbol('rk-overlay');
export const SELECT_CONTEXT_KEY: InjectionKey<SelectContext> = Symbol('rk-select');
export const DROPDOWN_CONTEXT_KEY: InjectionKey<DropdownContext> = Symbol('rk-dropdown');

export const LANE_BASE: Record<OverlayLane, number> = {
  dropdown: 20,
  popover: 30,
  tooltip: 40,
  dialog: 50,
  toast: 60,
};
