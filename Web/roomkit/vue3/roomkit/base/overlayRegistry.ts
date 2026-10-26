import type { OverlayContext } from './tokens';

const stack: OverlayContext[] = [];

export function setActiveOverlayContext(ctx: OverlayContext | null) {
  if (ctx && !stack.includes(ctx)) {
    stack.push(ctx);
  }
}

export function removeOverlayContext(ctx: OverlayContext) {
  const index = stack.lastIndexOf(ctx);
  if (index >= 0) stack.splice(index, 1);
}

export function getActiveOverlayContext(): OverlayContext | null {
  return stack[stack.length - 1] ?? null;
}
