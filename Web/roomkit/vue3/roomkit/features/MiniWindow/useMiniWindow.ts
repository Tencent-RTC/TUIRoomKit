import { getCurrentInstance, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import { useUIConfig } from '../../base';

interface RequestWindowOptions {
  width?: number;
  height?: number;
}

export interface MinimizeOptions {
  /**
   * Only open a real picture-in-picture window (default). Pass `false` for the in-page
   * floating fallback, which is only useful when the user explicitly asks for a mini
   * window — automatic callers leave the page alone if PiP cannot open.
   */
  pipOnly?: boolean;
  /**
   * Opened on the user's behalf rather than by an explicit request, e.g. when a screen
   * share starts. Only such a window is closed again by `dismissAuto`.
   */
  auto?: boolean;
}

interface DocumentPictureInPicture {
  requestWindow: (options?: RequestWindowOptions) => Promise<Window>;
}

// 16:9 content plus the control row under it
const PIP_WINDOW_SIZE = { width: 320, height: 236 };

function getPictureInPicture(): DocumentPictureInPicture | undefined {
  return (globalThis as { documentPictureInPicture?: DocumentPictureInPicture })
    .documentPictureInPicture;
}

// The API is still exposed inside iframes, but `requestWindow` rejects there:
// only a top-level browsing context may open a PiP window.
function isTopLevelWindow() {
  return typeof window !== 'undefined' && window.self === window.top;
}

export function isPictureInPictureSupported() {
  return isTopLevelWindow() && typeof getPictureInPicture()?.requestWindow === 'function';
}

// The PiP document starts blank: both the packaged style.css and the
// dev-time injected SFC styles live in the opener document only.
function adoptStyles(target: Document) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const style = target.createElement('style');
      style.textContent = Array.from(sheet.cssRules)
        .map(rule => rule.cssText)
        .join('\n');
      target.head.appendChild(style);
    } catch {
      // Cross-origin sheets deny cssRules access, reference them by href
      if (!sheet.href) continue;
      const link = target.createElement('link');
      link.rel = 'stylesheet';
      link.href = sheet.href;
      target.head.appendChild(link);
    }
  }
}

// Theme tokens are scoped to `.rk-root[data-rk-theme]`, so the mount point
// has to carry the same carrier attributes as the opener root.
function applyThemeCarrier(mount: HTMLElement, themeCarrier: HTMLElement | null) {
  mount.className = themeCarrier?.className || 'rk-root';
  for (const { name } of Array.from(mount.attributes)) {
    if (name.startsWith('data-rk-')) {
      mount.removeAttribute(name);
    }
  }
  for (const { name, value } of Array.from(themeCarrier?.attributes ?? [])) {
    if (name.startsWith('data-rk-')) {
      mount.setAttribute(name, value);
    }
  }
}

function createMountPoint(target: Document, themeCarrier: HTMLElement | null) {
  const mount = target.createElement('div');
  applyThemeCarrier(mount, themeCarrier);
  mount.style.height = '100vh';
  target.body.style.margin = '0';
  target.body.appendChild(mount);
  return mount;
}

export function useMiniWindow(root?: Readonly<Ref<HTMLElement | null>>) {
  const minimized = ref(false);
  const container = shallowRef<HTMLElement | null>(null);
  let pipWindow: Window | null = null;
  // True while `requestWindow` is pending, so a second call cannot open another window.
  let opening = false;
  let autoOpened = false;
  const { uiConfig } = useUIConfig();

  function themeCarrier() {
    return root?.value?.closest<HTMLElement>('.rk-root') ?? null;
  }

  function releasePipWindow() {
    container.value = null;
    if (!pipWindow) return;

    const target = pipWindow;
    pipWindow = null;
    target.removeEventListener('pagehide', handlePipClosed);
    target.close();
  }

  /* The system close button only notifies the PiP window itself, so this doubles as
     the `pagehide` handler. It deliberately leaves focus alone: the browser already
     decides where to go when the user closes the window through its own chrome. */
  function handlePipClosed() {
    autoOpened = false;
    minimized.value = false;
    releasePipWindow();
  }

  async function minimize({ pipOnly = true, auto = false }: MinimizeOptions = {}) {
    if (minimized.value || opening) return;
    autoOpened = auto;

    const pictureInPicture = getPictureInPicture();
    if (!pictureInPicture || !isPictureInPictureSupported()) {
      // Without the API the host falls back to an in-page floating window
      minimized.value = !pipOnly;
      return;
    }

    /* PiP-only callers hold `minimized` back until the window is ready: raising it
       first would flash the in-page window while the PiP window is still opening. */
    if (!pipOnly) {
      minimized.value = true;
    }
    opening = true;
    try {
      const target = await pictureInPicture.requestWindow(PIP_WINDOW_SIZE);
      // `dismissAuto` ran while the window was still opening.
      if (auto && !autoOpened) {
        target.close();
        return;
      }
      pipWindow = target;
      target.addEventListener('pagehide', handlePipClosed);
      adoptStyles(target.document);
      container.value = createMountPoint(target.document, themeCarrier());
      minimized.value = true;
    } catch {
      // PiP-only leaves the page as it was; otherwise the in-page window stays up.
      if (pipOnly) {
        handlePipClosed();
      } else {
        releasePipWindow();
      }
    } finally {
      opening = false;
    }
  }

  /* Restoring is a return to the opener tab, which may well be in the background by
     now. The opener can only take system focus by consuming the PiP window's transient
     activation, so this has to run inside the click handler and before the close. */
  function restore() {
    if (pipWindow) {
      window.focus();
    }
    handlePipClosed();
  }

  /* Unlike `restore`, nothing here comes from a click in the window, so focus stays
     wherever the user left it. */
  function dismissAuto() {
    if (autoOpened) {
      handlePipClosed();
    }
  }

  /* Closes whatever window is up, however it was opened, without moving focus. */
  function close() {
    if (minimized.value) {
      handlePipClosed();
    }
  }

  function toggle() {
    return minimized.value ? restore() : minimize();
  }

  watch(() => uiConfig.theme, () => {
    if (container.value) {
      applyThemeCarrier(container.value, themeCarrier());
    }
  });

  if (getCurrentInstance()) {
    onBeforeUnmount(releasePipWindow);
  }

  return {
    minimized,
    container,
    minimize,
    restore,
    dismissAuto,
    close,
    toggle,
  };
}
