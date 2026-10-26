import { getPlatform } from '@tencentcloud/universal-api';
import type { OverlayContext } from '../../tokens';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  type?: ToastType;
  message: string;
  duration?: number;
  showIcon?: boolean;
  appendTo?: string | HTMLElement;
}

export interface ToastHandle {
  close: () => void;
}

export interface ToastItem extends Required<Omit<ToastOptions, 'duration' | 'showIcon' | 'appendTo'>> {
  id: number;
  duration: number;
  showIcon: boolean;
  appendTo?: string | HTMLElement;
}

export interface ToastStore {
  getItems: () => ToastItem[];
  subscribe: (listener: () => void) => () => void;
  add: (options: ToastOptions) => ToastHandle;
  remove: (id: number) => void;
  dispose: () => void;
}

const stores = new WeakMap<OverlayContext, ToastStore>();
let seed = 0;

export function getToastStore(ctx: OverlayContext): ToastStore {
  const cached = stores.get(ctx);
  if (cached) return cached;

  let items: ToastItem[] = [];
  const listeners = new Set<() => void>();
  const timers = new Map<number, number>();

  const setItems = (next: ToastItem[]) => {
    items = next;
    listeners.forEach(listener => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const remove = (id: number) => {
    const timer = timers.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.delete(id);
    }
    setItems(items.filter(item => item.id !== id));
  };

  const add = (options: ToastOptions): ToastHandle => {
    const id = ++seed;
    const duration = options.duration ?? (getPlatform() === 'pc' ? 3000 : 2000);
    timers.forEach(timer => window.clearTimeout(timer));
    timers.clear();
    setItems([{
      id,
      type: options.type ?? 'info',
      message: options.message,
      duration,
      showIcon: options.showIcon !== false,
      appendTo: options.appendTo,
    }]);
    if (duration > 0) {
      timers.set(id, window.setTimeout(() => remove(id), duration));
    }
    return { close: () => remove(id) };
  };

  const dispose = () => {
    timers.forEach(timer => window.clearTimeout(timer));
    timers.clear();
    setItems([]);
    stores.delete(ctx);
  };

  const store: ToastStore = { getItems: () => items, subscribe, add, remove, dispose };
  stores.set(ctx, store);
  return store;
}

export function disposeToastStore(ctx: OverlayContext) {
  stores.get(ctx)?.dispose();
}
