import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { getPlatform } from '@tencentcloud/universal-api';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { ProvideIcons } from '../../icons/context';
import { removeOverlayContext, setActiveOverlayContext } from '../../overlayRegistry';
import { LANE_BASE, OVERLAY_CONTEXT_KEY } from '../../tokens';
import { setUIConfig, useUIConfig } from '../../uiConfig';
import type { ThemeName } from '../../uiConfig';
import MessageBoxHost from '../MessageBox/MessageBoxHost';
import { disposeMessageBoxStore } from '../MessageBox/store';
import { disposeToastStore } from '../Toast/store';
import ToastViewport from '../Toast/ToastViewport';
import type { OverlayAcquireOptions, OverlayContext, OverlayHandle, OverlayLane } from '../../tokens';
import './index.scss';

export interface RoomKitProviderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Base z-index added to every overlay lane. */
  baseZ?: number;
  /** Theme to apply; omitted keeps the stored theme. */
  theme?: ThemeName;
  /** Register this host for command TUIToast / TUIMessageBox. */
  command?: boolean;
  /** Transparent cover used by appendTo. */
  cover?: boolean;
  /** Fires with the effective theme whenever it changes. */
  onUpdateTheme?: (theme: ThemeName) => void;
  children?: ReactNode;
}

export interface RoomKitProviderExpose {
  context: OverlayContext;
}

type OverlayLayer = {
  lane: OverlayLane;
  zIndex: number;
  closeOnEsc: boolean;
  onClose?: () => void;
};

function createOverlayContext(getBaseZ: () => number): OverlayContext {
  let seed = 0;
  const layers = new Map<number, OverlayLayer>();
  const laneSeq: Record<OverlayLane, number> = {
    dropdown: 0,
    popover: 0,
    tooltip: 0,
    dialog: 0,
    toast: 0,
  };

  const topZ = () => {
    let max = 0;
    layers.forEach((layer) => {
      max = Math.max(max, layer.zIndex);
    });
    return max;
  };

  const ctx: OverlayContext & { layers: Map<number, OverlayLayer> } = {
    root: null,
    host: null,
    layers,
    acquire(lane: OverlayLane, options: OverlayAcquireOptions = {}): OverlayHandle {
      laneSeq[lane] += 1;
      let zIndex = getBaseZ() + LANE_BASE[lane] + laneSeq[lane];
      const currentTop = topZ();
      if (currentTop >= zIndex) {
        zIndex = currentTop + 1;
      }
      seed += 1;
      const id = seed;
      layers.set(id, {
        lane,
        zIndex,
        closeOnEsc: options.closeOnEsc !== false,
        onClose: options.onClose,
      });
      return { id, zIndex };
    },
    release(id: number) {
      layers.delete(id);
    },
  };
  return ctx;
}

export const RoomKitProvider = forwardRef<RoomKitProviderExpose, RoomKitProviderProps>((props, ref) => {
  const {
    baseZ = 0,
    theme,
    command = true,
    cover = false,
    onUpdateTheme,
    children,
    className,
    style,
    ...rootAttrs
  } = props;
  const isH5 = getPlatform() !== 'pc';

  const { uiConfig } = useUIConfig();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const baseZRef = useRef(baseZ);
  baseZRef.current = baseZ;

  // A stable object: command stores and the overlay registry key by its identity.
  const [context] = useState(() => createOverlayContext(() => baseZRef.current));
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({ context }), [context]);

  useLayoutEffect(() => {
    context.root = rootRef.current;
    context.host = hostRef.current;
    setReady(true);
  }, [context]);

  useLayoutEffect(() => {
    if (theme !== undefined) {
      setUIConfig({ theme });
    }
  }, [theme]);

  const currentTheme = uiConfig.theme;
  // Inline custom properties outrank the [data-rk-theme] token blocks, so only the active theme's colors go inline.
  const colors = uiConfig.colors[currentTheme];
  const rootStyle = {
    'background': cover ? 'transparent' : undefined,
    '--rk-brand': colors?.primaryColor,
    '--rk-bg-page': colors?.backgroundColor,
    '--rk-text-primary': colors?.textColor,
    '--rk-font': uiConfig.fontFamily,
    ...style,
  } as CSSProperties;
  const onUpdateThemeRef = useRef(onUpdateTheme);
  onUpdateThemeRef.current = onUpdateTheme;
  useEffect(() => {
    if (currentTheme !== undefined) {
      onUpdateThemeRef.current?.(currentTheme);
    }
  }, [currentTheme]);

  useLayoutEffect(() => {
    if (!command) {
      return undefined;
    }
    setActiveOverlayContext(context);
    return () => {
      removeOverlayContext(context);
    };
  }, [command, context]);

  useEffect(() => {
    const { layers } = context as OverlayContext & { layers: Map<number, OverlayLayer> };
    const closeTopByEsc = () => {
      const closable = [...layers.values()].filter(layer => layer.closeOnEsc);
      if (closable.length === 0) {
        return false;
      }
      const top = closable.reduce((best, layer) => (
        layer.zIndex > best.zIndex ? layer : best
      ));
      top.onClose?.();
      return true;
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }
      if (!closeTopByEsc()) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('keydown', onEsc, true);
    return () => {
      document.removeEventListener('keydown', onEsc, true);
    };
  }, [context]);

  useEffect(() => () => {
    disposeToastStore(context);
    disposeMessageBoxStore(context);
  }, [context]);

  return (
    <div
      {...rootAttrs}
      ref={rootRef}
      className={[cover ? 'rk-root rk-root-cover' : 'rk-root', isH5 ? 'is-h5' : '', className].filter(Boolean).join(' ')}
      style={rootStyle}
      data-rk-theme={currentTheme}
    >
      <OVERLAY_CONTEXT_KEY.Provider value={ready ? context : null}>
        <ProvideIcons icons={uiConfig.icons}>
          <div className="rk-root-slot">
            {ready ? children : null}
          </div>
          <div className="rk-overlay-root">
            <div ref={hostRef} className="rk-overlay-stack" />
            <div className="rk-overlay-toast">
              {ready ? <ToastViewport /> : null}
            </div>
            {ready ? <MessageBoxHost /> : null}
          </div>
        </ProvideIcons>
      </OVERLAY_CONTEXT_KEY.Provider>
    </div>
  );
});

RoomKitProvider.displayName = 'RoomKitProvider';

export default RoomKitProvider;
