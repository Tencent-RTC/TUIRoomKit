import { getContextForCommand } from '../../command/appendTo';
import { getMessageBoxStore } from './store';
import type { MessageBoxHandle, MessageBoxOptions } from './store';

function noopHandle<T>(value: T): Promise<T> & MessageBoxHandle {
  const promise = Promise.resolve(value) as Promise<T> & MessageBoxHandle;
  promise.close = () => undefined;
  return promise;
}

function openBox(apiName: string, mode: 'alert' | 'confirm' | 'danger', options: MessageBoxOptions) {
  const ctx = getContextForCommand(apiName, options.appendTo);
  if (!ctx) return null;
  return getMessageBoxStore(ctx).open(mode, options);
}

export const TUIMessageBox = {
  alert(options: MessageBoxOptions): Promise<void> & MessageBoxHandle {
    return (openBox('TUIMessageBox.alert', 'alert', options) ?? noopHandle(undefined)) as Promise<void> & MessageBoxHandle;
  },
  confirm(options: MessageBoxOptions): Promise<boolean> & MessageBoxHandle {
    return (openBox('TUIMessageBox.confirm', 'confirm', options) ?? noopHandle(false)) as Promise<boolean> & MessageBoxHandle;
  },
  danger(options: MessageBoxOptions): Promise<boolean> & MessageBoxHandle {
    return (openBox('TUIMessageBox.danger', 'danger', options) ?? noopHandle(false)) as Promise<boolean> & MessageBoxHandle;
  },
};

export type { MessageBoxHandle, MessageBoxOptions };
