import { computed, inject, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import { LANE_BASE, OVERLAY_CONTEXT_KEY } from '../tokens';
import type { OverlayHandle } from '../tokens';
import type { UseOverlayOptions } from './types';

function isInside(target: EventTarget | null, els: Array<HTMLElement | null | undefined>) {
  if (!(target instanceof Node)) return false;
  return els.some(el => el && el.contains(target));
}

/** Outermost `.rk-root` above `el` — the theme carrier and the positioning context. */
function themeRoot(el: HTMLElement): HTMLElement | null {
  let root: HTMLElement | null = null;
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (node.classList.contains('rk-root')) root = node;
  }
  return root;
}

export function useOverlay(options: UseOverlayOptions, ignoreEls: Array<Ref<HTMLElement | null | undefined>> = []) {
  const ctx = inject(OVERLAY_CONTEXT_KEY, null);
  const handle = shallowRef<OverlayHandle | null>(null);

  const zIndex = computed(() => handle.value?.zIndex ?? LANE_BASE[options.lane]);

  /* Seeded so dialogs that teleport on their first render still have a target;
     `syncHost` refines it once the anchor exists. */
  const host = shallowRef<HTMLElement | null>(ctx?.host.value ?? null);

  /* The provider's overlay stack lives in the opener document. An overlay anchored
     inside a picture-in-picture window has to stay in that window instead, so it
     falls back to the outermost `.rk-root` there: it is positioned and it carries
     the theme tokens the panel styles read. */
  const resolveHost = () => {
    const providerHost = ctx?.host.value ?? null;
    const reference = options.reference?.value ?? null;
    if (!providerHost || !reference || providerHost.ownerDocument === reference.ownerDocument) {
      return providerHost;
    }
    return themeRoot(reference) ?? reference.ownerDocument.body;
  };

  const acquire = () => {
    if (handle.value) return;
    if (!ctx) {
      console.warn(`[RoomKit] Overlay lane "${options.lane}" requires RoomKitProvider.`);
      return;
    }
    handle.value = ctx.acquire(options.lane, {
      closeOnEsc: options.closeOnEsc !== false,
      onClose: () => options.onClose?.(),
    });
  };

  const release = () => {
    if (!ctx || !handle.value) return;
    ctx.release(handle.value.id);
    handle.value = null;
  };

  const close = () => {
    options.onClose?.();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!options.open.value || options.closeOnOutside === false) return;
    const nodes = ignoreEls.map(item => item.value);
    if (isInside(event.target, nodes)) return;
    close();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (ctx || !options.open.value || options.closeOnEsc === false) return;
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  };

  /* The provider's Esc handler is bound to its own document, so a key pressed in the
     picture-in-picture window never reaches it. Handle it here even when ctx exists. */
  const onForeignKeydown = (event: KeyboardEvent) => {
    if (!options.open.value || options.closeOnEsc === false) return;
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  };

  let boundDoc: Document | null = null;

  const bindForeignDoc = (doc: Document | null) => {
    if (boundDoc === doc) return;
    boundDoc?.removeEventListener('pointerdown', onPointerDown, true);
    boundDoc?.removeEventListener('keydown', onForeignKeydown, true);
    boundDoc = doc;
    doc?.addEventListener('pointerdown', onPointerDown, true);
    doc?.addEventListener('keydown', onForeignKeydown, true);
  };

  /* A teleport can carry the anchor into another window without any ref changing
     value, so which document it belongs to cannot be tracked reactively. Resolve it
     on every open instead — by then the anchor sits where the user clicked it. */
  const syncHost = () => {
    host.value = resolveHost();
    const doc = host.value?.ownerDocument ?? null;
    bindForeignDoc(doc && doc !== document ? doc : null);
  };

  watch(() => options.open.value, (open) => {
    if (!open) {
      release();
      return;
    }
    syncHost();
    acquire();
  }, { immediate: true });

  watch(() => ctx?.host.value, syncHost);

  onMounted(() => {
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeydown, true);
    syncHost();
  });

  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeydown, true);
    bindForeignDoc(null);
    release();
  });

  return {
    ctx,
    host,
    zIndex,
  };
}
