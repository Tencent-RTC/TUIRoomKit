import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { IconShare, TUIDropdown, TUIDropdownItem, TUIMessageBox, TUIToast } from '../../../base';
import { hasInterceptor, runInterceptors } from '../../../core/interceptors';
import { useI18n } from '../../../i18n';
import { bindOverflowSubmenu, OVERFLOW_SUBMENU_READY } from '../../../layouts/OverflowToolbarPC/overflowSubmenu';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import { ScreenShareEntryContext, useScreenShare } from './useScreenShare';
import { confirmStopScreenShare } from './confirmStopScreenShare';
import type { ScreenShareEntry, ScreenShareEntryRegistry, ScreenShareFailure } from './useScreenShare';
import './ScreenShareButton.scss';

export interface ScreenShareButtonProps {
  /** Renderless entries that register through `ScreenShareEntryContext`; any entry turns the control into a menu. */
  children?: ReactNode;
}

export function ScreenShareButton(props: ScreenShareButtonProps) {
  const { children } = props;
  const { t } = useI18n();
  const [sources, setSources] = useState<Array<() => ScreenShareEntry>>([]);
  const [, refresh] = useReducer((tick: number) => tick + 1, 0);
  const registry = useMemo<ScreenShareEntryRegistry>(() => ({
    register: (source) => {
      setSources(prev => [...prev, source]);
      return () => {
        setSources(prev => prev.filter(item => item !== source));
      };
    },
    refresh,
  }), []);
  const entries = sources.map(source => source());

  const {
    isBusy,
    canShareScreen,
    hasScreenFault,
    isScreenCaptureUnsupported,
    isLocalSharing,
    isRemoteSharing,
    startScreenShare,
    stopScreenShare,
  } = useScreenShare();

  const activeEntry = entries.find(entry => entry.active);
  const isSharing = isLocalSharing || !!activeEntry;
  let label = isLocalSharing ? t('ScreenShare.StopConfirm') : t('ScreenShare.Share');
  if (activeEntry) {
    label = activeEntry.stopLabel;
  }
  /** Host and admin keep control; a share already in progress can still be stopped. */
  const isShareBlocked = !canShareScreen && !isSharing;
  const menuItems = [
    { act: 'screen', label: t('ScreenShare.StartConfirm'), icon: IconShare },
    ...entries.map(entry => ({ act: entry.act, label: entry.label, icon: entry.icon })),
  ];

  function notifyFailure(reason: ScreenShareFailure) {
    if (reason === 'capture') {
      return;
    }
    const type = reason === 'failed' ? 'error' : 'warning';
    TUIToast[type](t(`ScreenShare.Failure.${reason}`));
  }

  async function startWithConfirm() {
    if (!canShareScreen) {
      notifyFailure('not-allowed');
      return;
    }
    if (isRemoteSharing) {
      notifyFailure('remote-sharing');
      return;
    }
    if (!isScreenCaptureUnsupported && hasInterceptor('startScreenShare')) {
      if (!await runInterceptors('startScreenShare')) {
        return;
      }
    } else if (!isScreenCaptureUnsupported) {
      const confirmed = await TUIMessageBox.confirm({
        title: t('ScreenShare.StartTitle'),
        message: t('ScreenShare.StartMessage'),
        confirmText: t('ScreenShare.StartConfirm'),
        cancelText: t('ScreenShare.Cancel'),
      });
      if (!confirmed) {
        return;
      }
    }
    /**
     * No success toast: when two people start sharing at once the engine keeps
     * only one stream, so a toast here would confirm a share that is about to be
     * dropped. Silence means success; the active button state is the feedback.
     */
    const failure = await startScreenShare();
    if (failure) {
      notifyFailure(failure);
    }
  }

  function toggleScreenShare() {
    void (isLocalSharing ? confirmStopScreenShare(stopScreenShare) : startWithConfirm());
  }

  function stopShare() {
    if (activeEntry) {
      activeEntry.stop();
      return;
    }
    toggleScreenShare();
  }

  function runItem(act: string) {
    if (act === 'screen') {
      void startWithConfirm();
      return;
    }
    entries.find(entry => entry.act === act)?.run();
  }

  const [menuOpen, setMenuOpen] = useState(false);

  /** Nothing in the menu applies while someone else shares, so say why instead of opening it. */
  function canOpenMenu(): boolean {
    if (!canShareScreen) {
      notifyFailure('not-allowed');
      return false;
    }
    if (isRemoteSharing) {
      notifyFailure('remote-sharing');
      return false;
    }
    return true;
  }

  function onMenuOpen(open: boolean) {
    if (open && isSharing) {
      setMenuOpen(false);
      stopShare();
      return;
    }
    setMenuOpen(open && canOpenMenu());
  }

  function onCommand(act: string | number) {
    setMenuOpen(false);
    runItem(String(act));
  }

  // The listeners bound below outlive the render that bound them, so they read the latest one.
  const latestRef = useRef({ isSharing, stopShare, canOpenMenu, runItem, menuItems, t });
  latestRef.current = { isSharing, stopShare, canOpenMenu, runItem, menuItems, t };

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const hasEntries = entries.length > 0;

  const bindMenuHost = useCallback((el: HTMLDivElement) => {
    const keepCollapsedClosed = (event: MouseEvent) => {
      if (getComputedStyle(el).display === 'none') {
        event.stopPropagation();
        // While sharing there is no submenu, so the more menu clicks the button directly.
        if (latestRef.current.isSharing) {
          latestRef.current.stopShare();
        }
      }
    };
    el.addEventListener('click', keepCollapsedClosed, true);
    let unbindSubmenu = () => {};
    if (latestRef.current.isSharing) {
      // The more menu caches whether an entry drills; ask it to re-read now that this one does not.
      el.dispatchEvent(new CustomEvent(OVERFLOW_SUBMENU_READY, { bubbles: true }));
    } else {
      // The more menu reads this while the button is collapsed, and drills in place.
      unbindSubmenu = bindOverflowSubmenu(el, () => ({
        title: latestRef.current.t('ScreenShare.Share'),
        hint: '',
        items: latestRef.current.menuItems,
        run: (act) => {
          if (latestRef.current.canOpenMenu()) {
            latestRef.current.runItem(act);
          }
          return true;
        },
      }));
    }
    return () => {
      el.removeEventListener('click', keepCollapsedClosed, true);
      unbindSubmenu();
    };
  }, []);

  useEffect(() => {
    const el = anchorRef.current;
    if (!hasEntries || !el) {
      return undefined;
    }
    return bindMenuHost(el);
  }, [hasEntries, isSharing, bindMenuHost]);

  const button = (
    <ToolbarButtonPC
      label={label}
      icon={IconShare}
      active={isSharing}
      blocked={isShareBlocked}
      loading={isBusy}
      notice={hasScreenFault}
      onClick={hasEntries ? undefined : toggleScreenShare}
    />
  );

  return (
    <ScreenShareEntryContext.Provider value={registry}>
      {hasEntries
        ? (
          <div ref={anchorRef}>
            <TUIDropdown
              open={menuOpen}
              trigger="click"
              placement="top"
              offset={12}
              onUpdateOpen={onMenuOpen}
              onCommand={onCommand}
              menuSlot={menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <TUIDropdownItem key={item.act} command={item.act}>
                    <Icon className="screen-share-menu-icon" size={16} />
                    {item.label}
                  </TUIDropdownItem>
                );
              })}
            >
              {button}
            </TUIDropdown>
          </div>
        )
        : button}
      {children}
    </ScreenShareEntryContext.Provider>
  );
}

export default ScreenShareButton;
