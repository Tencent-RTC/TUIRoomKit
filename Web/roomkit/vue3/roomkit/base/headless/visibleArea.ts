export interface VisibleArea {
  x: number;
  y: number;
  width: number;
  height: number;
  hostWidth: number;
  hostHeight: number;
}

/** The window `el` is laid out in — a picture-in-picture document has its own. */
function viewOf(el: HTMLElement | null | undefined): Window {
  return el?.ownerDocument.defaultView ?? window;
}

/** Window plus overflow scrollers that move `el`, not inner lists. */
export function getScrollParents(el: HTMLElement | null | undefined): EventTarget[] {
  const view = viewOf(el);
  const parents: EventTarget[] = [view];
  const stop = el?.ownerDocument.documentElement ?? document.documentElement;
  let node = el?.parentElement ?? null;
  while (node && node !== stop) {
    const style = view.getComputedStyle(node);
    const overflow = `${style.overflowX} ${style.overflowY}`;
    if (/(auto|scroll|overlay)/.test(overflow)) parents.push(node);
    node = node.parentElement;
  }
  return parents;
}

/** Listen to window + scroll parents of the given nodes. Does not hear inner lists. */
export function subscribeScrollParents(
  els: Array<HTMLElement | null | undefined>,
  handler: () => void,
): () => void {
  const targets = new Set<EventTarget>();
  els.forEach((el) => {
    getScrollParents(el).forEach(target => targets.add(target));
  });
  targets.forEach((target) => {
    target.addEventListener('scroll', handler, { passive: true });
  });
  return () => {
    targets.forEach((target) => {
      target.removeEventListener('scroll', handler);
    });
  };
}

export function getVisibleArea(host: HTMLElement): VisibleArea {
  const view = viewOf(host);
  const hostRect = host.getBoundingClientRect();
  const left = Math.max(hostRect.left, 0);
  const right = Math.min(hostRect.right, view.innerWidth);
  const top = Math.max(hostRect.top, 0);
  const bottom = Math.min(hostRect.bottom, view.innerHeight);
  return {
    x: left - hostRect.left,
    y: top - hostRect.top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
    hostWidth: hostRect.width,
    hostHeight: hostRect.height,
  };
}
