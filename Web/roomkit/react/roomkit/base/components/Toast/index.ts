import { getContextForCommand } from '../../command/appendTo';
import { getToastStore } from './store';
import type { ToastHandle, ToastOptions } from './store';

function showToast(options: ToastOptions): ToastHandle {
  const ctx = getContextForCommand('TUIToast', options.appendTo);
  if (!ctx) return { close: () => undefined };
  return getToastStore(ctx).add(options);
}

function normalize(input: Omit<ToastOptions, 'type'> | string): Omit<ToastOptions, 'type'> {
  return typeof input === 'string' ? { message: input } : input;
}

export const TUIToast = Object.assign(showToast, {
  info: (input: Omit<ToastOptions, 'type'> | string) => showToast({ ...normalize(input), type: 'info' }),
  success: (input: Omit<ToastOptions, 'type'> | string) => showToast({ ...normalize(input), type: 'success' }),
  warning: (input: Omit<ToastOptions, 'type'> | string) => showToast({ ...normalize(input), type: 'warning' }),
  error: (input: Omit<ToastOptions, 'type'> | string) => showToast({ ...normalize(input), type: 'error' }),
});

export type { ToastHandle, ToastOptions };
