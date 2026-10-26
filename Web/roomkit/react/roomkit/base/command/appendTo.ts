import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import RoomKitProvider from '../components/RoomKitProvider/index';
import type { RoomKitProviderExpose } from '../components/RoomKitProvider/index';
import { requireOverlayContext } from './requireOverlay';
import type { OverlayContext } from '../tokens';

export type AppendTo = string | HTMLElement;

const hosts = new WeakMap<HTMLElement, { root: Root; ctx: OverlayContext }>();

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

  let expose: RoomKitProviderExpose | null = null;
  const root = createRoot(shell);
  // Callers use the context right away, so the provider has to commit synchronously.
  flushSync(() => {
    root.render(createElement(RoomKitProvider, {
      command: false,
      cover: true,
      ref: (value: RoomKitProviderExpose | null) => {
        if (value) {
          expose = value;
        }
      },
    }));
  });
  const ctx = (expose as RoomKitProviderExpose | null)!.context;
  hosts.set(target, { root, ctx });
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
