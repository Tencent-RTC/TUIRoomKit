import { onBeforeUnmount, onMounted } from 'vue';
import type { Ref } from 'vue';

/**
 * Keyboard avoidance for hand-held layouts.
 *
 * Platform keyboards disagree about what a keyboard does: some resize the
 * layout viewport (the grid squeezes), some pan the visual viewport (the
 * page slides), each OS point release picks a different mix. This hook
 * normalizes every device to one overlay-style behavior: while an editable
 * element holds focus, `box` is frozen at its pre-keyboard height, and the
 * keyboard top is published as the `--rk-keyboard-offset` custom property
 * (pixels between the box bottom and the keyboard top; 0 when no keyboard).
 *
 * The keyboard height comes from the Chromium VirtualKeyboard API while it
 * actually reports one, and from the visualViewport difference otherwise —
 * the API exists but stays a zero-rect shell unless the page sets
 * overlaysContent, which this hook never does. The scene decides what rides
 * above the keyboard by positioning elements against that variable, because
 * only the scene knows which elements may move (teleported overlays should
 * not, the composer should).
 */

const KEYBOARD_GONE_TOLERANCE = 24;
/* One window for the keyboard retraction: an iOS keyboard animation runs
   250-400ms, and a blur can add a few frames before it even starts. It is
   the absolute thaw backstop after the field loses focus. */
const KEYBOARD_ANIMATION_WINDOW_MS = 600;

export interface UseKeyboardAvoidanceOptions {
  /** Engagement gate evaluated on each focus; the hook stays inert while it
   * returns false. The scene owns the platform/orientation policy. */
  enabled?: () => boolean;
}

function isEditableElement(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
}

/* Chromium's VirtualKeyboard API reports the keyboard rect directly: a
 * positive signal, so the inferred-height math and its tolerance below are
 * only the WebKit fallback. Only the sensor part is used here — overlaysContent
 * stays untouched: the freeze already protects the layout, and forcing overlay
 * mode for the whole session would blind composers outside this hook (e.g.
 * the education landscape barrage). */
interface VirtualKeyboardLike {
  boundingRect: { height: number };
  addEventListener(type: 'geometrychange', listener: () => void): void;
  removeEventListener(type: 'geometrychange', listener: () => void): void;
}

function getVirtualKeyboard(): VirtualKeyboardLike | null {
  const keyboard = (navigator as { virtualKeyboard?: VirtualKeyboardLike }).virtualKeyboard;
  return keyboard ?? null;
}

export function useKeyboardAvoidance(box: Ref<HTMLElement | null>, options: UseKeyboardAvoidanceOptions = {}) {
  const enabled = options.enabled ?? (() => true);
  let following = false;
  let frozenHeight = 0;
  let frozenWidth = 0;
  let unfreezeTimer: ReturnType<typeof setTimeout> | undefined;
  let backstopTimer: ReturnType<typeof setTimeout> | undefined;

  function syncOffset() {
    const boxElement = box.value;
    const viewport = window.visualViewport;
    if (!boxElement || !viewport) {
      return;
    }
    /* A width change while frozen means the device rotated: the frozen
       portrait height no longer describes this viewport and the thaw
       condition below could never be met in the shorter orientation. Thaw
       and hand over to the rotated layout; the enabled gate keeps the hook
       from freezing again where it should not (e.g. education landscape). */
    if (Math.abs(viewport.width - frozenWidth) > Math.max(32, frozenWidth * 0.2)) {
      thaw();
      return;
    }
    clearTimeout(unfreezeTimer);
    const keyboard = getVirtualKeyboard();
    /* The Chromium VirtualKeyboard API stays a zero-rect shell until the page
       sets overlaysContent — which this hook never does (a session-wide
       overlay mode would blind composers outside this hook). So the API is
       only trusted while it actually reports a height; a dormant or absent
       API reads the viewport difference instead. WebKit's own avoidance pan
       (visualViewport.offsetTop) is part of that sum, so a natively panning
       device never slides twice. */
    const apiHeight = keyboard ? Math.max(0, keyboard.boundingRect.height) : 0;
    const keyboardTop = viewport.offsetTop + viewport.height;
    const offset = apiHeight > 0 ? apiHeight : Math.max(0, frozenHeight - keyboardTop);
    boxElement.style.setProperty('--rk-keyboard-offset', `${Math.round(offset)}px`);
    /* Gone depends on which sensor spoke: the API's positive signal is
       height 0, the viewport keeps the tolerance below — recovered heights
       land a few pixels short of the frozen snapshot, and an exact compare
       would wedge the thaw. */
    const gone = apiHeight > 0
      ? offset <= 0
      : viewport.height >= frozenHeight - KEYBOARD_GONE_TOLERANCE;
    if (gone) {
      unfreezeTimer = setTimeout(thaw, 60);
    }
  }

  function freeze() {
    const boxElement = box.value;
    if (!boxElement || following) {
      return;
    }
    following = true;
    frozenHeight = Math.max(boxElement.clientHeight, window.visualViewport?.height ?? 0);
    frozenWidth = window.visualViewport?.width ?? boxElement.clientWidth;
    boxElement.style.height = `${frozenHeight}px`;
    boxElement.classList.add('is-editing');
    /* No pre-slide: the offset stays unset (the scene CSS reads it as 0)
       until the first keyboard frame arrives, then follows every frame. */
    window.visualViewport?.addEventListener('resize', syncOffset);
    window.visualViewport?.addEventListener('scroll', syncOffset);
    getVirtualKeyboard()?.addEventListener('geometrychange', syncOffset);
  }

  function thaw() {
    const boxElement = box.value;
    if (!boxElement || !following) {
      return;
    }
    following = false;
    clearTimeout(unfreezeTimer);
    clearTimeout(backstopTimer);
    window.visualViewport?.removeEventListener('resize', syncOffset);
    window.visualViewport?.removeEventListener('scroll', syncOffset);
    getVirtualKeyboard()?.removeEventListener('geometrychange', syncOffset);
    boxElement.classList.remove('is-editing');
    boxElement.style.height = '';
    boxElement.style.removeProperty('--rk-keyboard-offset');
  }

  function onDocFocusIn(event: FocusEvent) {
    if (!isEditableElement(event.target)) {
      return;
    }
    if (!enabled()) {
      return;
    }
    /* A refocus cancels the thaw backstop below: the keyboard is staying
       up, so the freeze must stay too. */
    clearTimeout(backstopTimer);
    freeze();
  }

  function onDocFocusOut(event: FocusEvent) {
    if (!following) {
      return;
    }
    if (isEditableElement(event.relatedTarget)) {
      return;
    }
    /* Focus leaving the field (send button tap, keyboard dismiss) closes the
       keyboard; the viewport listener thaws once it has fully retracted, so
       a tap on the send button lands where the button was pressed. The
       animation window below is the absolute backstop for recovery signals
       the tolerance cannot absorb (browser bars toggling mid-session on a
       scrollable host page, exotic kernels); the following guard makes it a
       no-op when the viewport path already thawed. Downstream focusouts
       from non-editable elements are ignored: the field's own blur armed
       this window already. */
    if (isEditableElement(event.target)) {
      clearTimeout(backstopTimer);
      backstopTimer = setTimeout(thaw, KEYBOARD_ANIMATION_WINDOW_MS);
    }
  }

  onMounted(() => {
    /* Touch-first devices only: a mouse-driven focus has no keyboard to
       avoid, and freezing there would flash the layout once per click. */
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (!coarse) {
      return;
    }
    document.addEventListener('focusin', onDocFocusIn);
    document.addEventListener('focusout', onDocFocusOut);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('focusin', onDocFocusIn);
    document.removeEventListener('focusout', onDocFocusOut);
    thaw();
  });
}
