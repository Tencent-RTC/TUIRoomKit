import type { OverlayContext } from '../../tokens';

export type MessageBoxAction = 'confirm' | 'cancel' | 'close';

export interface MessageBoxOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  closable?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  /**
   * Called with the action that closed the box.
   * 'confirm' — primary button; 'cancel' — secondary button; 'close' — overlay / Esc / code.
   */
  callback?: (action: MessageBoxAction) => void;
  appendTo?: string | HTMLElement;
}

export interface MessageBoxHandle {
  close: () => void;
}

export type MessageBoxMode = 'alert' | 'confirm' | 'danger';

export interface MessageBoxItem {
  id: number;
  mode: MessageBoxMode;
  options: MessageBoxOptions;
  resolve: (value: boolean) => void;
}

export interface MessageBoxStore {
  getItems: () => MessageBoxItem[];
  subscribe: (listener: () => void) => () => void;
  open: (mode: MessageBoxMode, options: MessageBoxOptions) => Promise<boolean> & MessageBoxHandle;
  close: (id: number, action: MessageBoxAction) => void;
  dispose: () => void;
}

const stores = new WeakMap<OverlayContext, MessageBoxStore>();
let seed = 0;

export function getMessageBoxStore(ctx: OverlayContext): MessageBoxStore {
  const cached = stores.get(ctx);
  if (cached) return cached;

  let items: MessageBoxItem[] = [];
  const listeners = new Set<() => void>();

  const setItems = (next: MessageBoxItem[]) => {
    items = next;
    listeners.forEach(listener => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const close = (id: number, action: MessageBoxAction) => {
    const item = items.find(entry => entry.id === id);
    if (!item) return;
    setItems(items.filter(entry => entry.id !== id));
    item.options.callback?.(action);
    item.resolve(action === 'confirm');
  };

  const open = (mode: MessageBoxMode, options: MessageBoxOptions) => {
    const id = ++seed;
    let resolve!: (value: boolean) => void;
    const promise = new Promise<boolean>((next) => {
      resolve = next;
    }) as Promise<boolean> & MessageBoxHandle;
    setItems([...items, { id, mode, options, resolve }]);
    promise.close = () => close(id, 'close');
    return promise;
  };

  const dispose = () => {
    const pending = items;
    setItems([]);
    pending.forEach((item) => {
      item.options.callback?.('close');
      item.resolve(false);
    });
    stores.delete(ctx);
  };

  const store: MessageBoxStore = { getItems: () => items, subscribe, open, close, dispose };
  stores.set(ctx, store);
  return store;
}

export function disposeMessageBoxStore(ctx: OverlayContext) {
  stores.get(ctx)?.dispose();
}
