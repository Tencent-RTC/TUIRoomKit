import { createApp } from 'vue';
import type { App, ComponentPublicInstance } from 'vue';
import RoomKitProvider from '../components/RoomKitProvider/index.vue';
import { requireOverlayContext } from './requireOverlay';
import type { OverlayContext } from '../tokens';

export type AppendTo = string | HTMLElement;

type HostExpose = ComponentPublicInstance & { context: OverlayContext };

const hosts = new WeakMap<HTMLElement, { app: App; ctx: OverlayContext }>();

export function resolveAppendTo(target: AppendTo): HTMLElement | null {
  if (typeof target === 'string') {
    return document.querySelector(target);
  }
  return target;
}

export function ensureAppendHost(target: HTMLElement): OverlayContext {
  const cached = hosts.get(target);
  if (cached) {
    return cached.ctx;
  }

  const isViewport = target === document.body || target === document.documentElement;
  if (!isViewport) {
    const { position } = getComputedStyle(target);
    if (position === 'static') {
      // Host may be a static container; overlays need a positioned ancestor.
      // eslint-disable-next-line no-param-reassign
      target.style.position = 'relative';
    }
  }

  const shell = document.createElement('div');
  shell.className = isViewport ? 'rk-append-to rk-append-to-viewport' : 'rk-append-to';
  target.appendChild(shell);

  const app = createApp(RoomKitProvider, {
    command: false,
    cover: true,
  });
  const vm = app.mount(shell) as HostExpose;
  const ctx = vm.context;
  hosts.set(target, { app, ctx });
  return ctx;
}

export function getContextForCommand(apiName: string, appendTo?: AppendTo): OverlayContext | null {
  if (appendTo != null) {
    const el = resolveAppendTo(appendTo);
    if (el) {
      return ensureAppendHost(el);
    }
    console.warn(`[RoomKit] ${apiName} appendTo did not match an element. Falling back to document.body.`);
    return ensureAppendHost(document.body);
  }
  return requireOverlayContext(apiName);
}
