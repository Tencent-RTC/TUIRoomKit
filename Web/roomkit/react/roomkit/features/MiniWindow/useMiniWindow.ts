import { useEffect, useRef, useState } from 'react';
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
// dev-time injected styles live in the opener document only.
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
      // eslint-disable-next-line no-continue
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
  // eslint-disable-next-line no-param-reassign
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
  // eslint-disable-next-line no-param-reassign
  target.body.style.margin = '0';
  target.body.appendChild(mount);
  return mount;
}

export function useMiniWindow(root?: HTMLElement | null) {
  const [minimized, setMinimizedState] = useState(false);
  const [container, setContainerState] = useState<HTMLElement | null>(null);
  const rootRef = useRef(root);
  rootRef.current = root;
  const { uiConfig } = useUIConfig();

  // Created once so the `pagehide` listener keeps one identity across renders.
  const [controller] = useState(() => {
    let minimizedValue = false;
    let containerValue: HTMLElement | null = null;
    let pipWindow: Window | null = null;
    // True while `requestWindow` is pending, so a second call cannot open another window.
    let opening = false;
    let autoOpened = false;

    function setMinimized(next: boolean) {
      minimizedValue = next;
      setMinimizedState(next);
    }

    function setContainer(next: HTMLElement | null) {
      containerValue = next;
      setContainerState(next);
    }

    function themeCarrier() {
      return rootRef.current?.closest<HTMLElement>('.rk-root') ?? null;
    }

    function releasePipWindow() {
      setContainer(null);
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
      setMinimized(false);
      releasePipWindow();
    }

    async function minimize({ pipOnly = true, auto = false }: MinimizeOptions = {}) {
      if (minimizedValue || opening) return;
      autoOpened = auto;

      const pictureInPicture = getPictureInPicture();
      if (!pictureInPicture || !isPictureInPictureSupported()) {
        // Without the API the host falls back to an in-page floating window
        setMinimized(!pipOnly);
        return;
      }

      /* PiP-only callers hold `minimized` back until the window is ready: raising it
         first would flash the in-page window while the PiP window is still opening. */
      if (!pipOnly) {
        setMinimized(true);
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
        setContainer(createMountPoint(target.document, themeCarrier()));
        setMinimized(true);
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
      if (minimizedValue) {
        handlePipClosed();
      }
    }

    function toggle() {
      return minimizedValue ? restore() : minimize();
    }

    function syncTheme() {
      if (containerValue) {
        applyThemeCarrier(containerValue, themeCarrier());
      }
    }

    return {
      minimize,
      restore,
      dismissAuto,
      close,
      toggle,
      releasePipWindow,
      syncTheme,
    };
  });

  const themeFirstRunRef = useRef(true);
  useEffect(() => {
    if (themeFirstRunRef.current) {
      themeFirstRunRef.current = false;
      return;
    }
    controller.syncTheme();
  }, [uiConfig.theme, controller]);

  useEffect(() => controller.releasePipWindow, [controller]);

  return {
    minimized,
    container,
    minimize: controller.minimize,
    restore: controller.restore,
    dismissAuto: controller.dismissAuto,
    close: controller.close,
    toggle: controller.toggle,
  };
}
