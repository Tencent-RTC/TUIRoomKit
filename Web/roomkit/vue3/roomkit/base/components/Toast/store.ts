import { getPlatform } from '@tencentcloud/universal-api';
import { ref } from 'vue';
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
  items: ReturnType<typeof ref<ToastItem[]>>;
  add: (options: ToastOptions) => ToastHandle;
  remove: (id: number) => void;
  dispose: () => void;
}

const stores = new WeakMap<OverlayContext, ToastStore>();
let seed = 0;

export function getToastStore(ctx: OverlayContext): ToastStore {
  const cached = stores.get(ctx);
  if (cached) return cached;

  const items = ref<ToastItem[]>([]);
  const timers = new Map<number, number>();

  const remove = (id: number) => {
    const timer = timers.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.delete(id);
    }
    items.value = items.value.filter(item => item.id !== id);
  };

  const add = (options: ToastOptions): ToastHandle => {
    const id = ++seed;
    const isPC = getPlatform() === 'pc';
    const duration = options.duration ?? (isPC ? 3000 : 2000);
    const next: ToastItem = {
      id,
      type: options.type ?? 'info',
      message: options.message,
      duration,
      showIcon: options.showIcon !== false,
      appendTo: options.appendTo,
    };
    // PC stacks from the top and the newest toast lands underneath.
    // H5 keeps a single centered toast, so a new one replaces the old.
    if (isPC) {
      items.value = [...items.value, next];
    } else {
      timers.forEach(timer => window.clearTimeout(timer));
      timers.clear();
      items.value = [next];
    }
    if (duration > 0) {
      timers.set(id, window.setTimeout(() => remove(id), duration));
    }
    return { close: () => remove(id) };
  };

  const dispose = () => {
    timers.forEach(timer => window.clearTimeout(timer));
    timers.clear();
    items.value = [];
    stores.delete(ctx);
  };

  const store: ToastStore = { items, add, remove, dispose };
  stores.set(ctx, store);
  return store;
}

export function disposeToastStore(ctx: OverlayContext) {
  stores.get(ctx)?.dispose();
}
