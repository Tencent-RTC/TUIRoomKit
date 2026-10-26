import { onBeforeUnmount, watch } from 'vue';
import type { Ref } from 'vue';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const rootLocks = new WeakMap<HTMLElement, { count: number; overflow: string }>();

function lockScroll(lock: boolean, root?: Ref<HTMLElement | null>) {
  const rootEl = root?.value ?? null;
  if (!rootEl) return;

  if (lock) {
    const rec = rootLocks.get(rootEl) ?? { count: 0, overflow: rootEl.style.overflow };
    if (rec.count === 0) rootEl.style.overflow = 'hidden';
    rec.count += 1;
    rootLocks.set(rootEl, rec);
    return;
  }

  const rec = rootLocks.get(rootEl);
  if (!rec) return;
  rec.count -= 1;
  if (rec.count <= 0) {
    rootEl.style.overflow = rec.overflow;
    rootLocks.delete(rootEl);
  }
}

export function useModality(open: Ref<boolean>, panel: Ref<HTMLElement | null>, root?: Ref<HTMLElement | null>) {
  let lastFocus: HTMLElement | null = null;
  let held = false;

  const setLock = (lock: boolean) => {
    if (lock) {
      if (held) return;
      lockScroll(true, root);
      held = true;
      return;
    }
    if (!held) return;
    lockScroll(false, root);
    held = false;
  };

  const trap = (event: KeyboardEvent) => {
    if (!open.value || event.key !== 'Tab' || !panel.value) return;
    const nodes = Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      last.focus({ preventScroll: true });
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus({ preventScroll: true });
      event.preventDefault();
    }
  };

  const focusPanel = (el: HTMLElement) => {
    const target = el.hasAttribute('tabindex')
      ? el
      : el.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus({ preventScroll: true });
  };

  watch(open, (value) => {
    if (value) {
      lastFocus = document.activeElement as HTMLElement | null;
      setLock(true);
      document.addEventListener('keydown', trap, true);
    } else {
      setLock(false);
      document.removeEventListener('keydown', trap, true);
      lastFocus?.focus?.({ preventScroll: true });
    }
  }, { immediate: true });

  watch([open, panel], ([isOpen, el]) => {
    if (!isOpen || !el) return;
    requestAnimationFrame(() => focusPanel(el));
  });

  onBeforeUnmount(() => {
    setLock(false);
    document.removeEventListener('keydown', trap, true);
  });
}
