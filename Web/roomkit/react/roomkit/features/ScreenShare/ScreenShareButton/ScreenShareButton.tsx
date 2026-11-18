import { useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import { DeviceError, useDeviceState } from 'tuikit-atomicx-react/room';
import { IconShare, TUIDropdown, TUIDropdownItem } from '../../../base';
import { useI18n } from '../../../i18n';
import type { OverflowBehavior } from '../../../layouts/OverflowToolbarPC/overflowItem';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import { SCREEN_SHARE_ENTRY_KEY, useScreenShare } from '../useScreenShare';
import type { ScreenShareEntry, ScreenShareEntryRegistry } from '../useScreenShare';
import './ScreenShareButton.scss';

export interface ScreenShareButtonProps {
  /** Renderless entries that register through `SCREEN_SHARE_ENTRY_KEY`; any entry turns the control into a menu. */
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
    holder,
    isBusy,
    canShare,
    ensureCanStart,
    startScreenShare,
    stopScreenShare,
  } = useScreenShare();
  const { screenLastError } = useDeviceState();

  const hasScreenFault = screenLastError !== DeviceError.NoError;
  const activeEntry = entries.find(entry => entry.active);
  /** Any local share holds the control, the board included; an entry only names how to end it. */
  const isSharing = holder === 'local-screen' || holder === 'local-board';

  /**
   * The one place that decides what picking the control does; the toolbar button and the
   * more-menu entry both read it, so the two never drift apart.
   * - stop: a local share holds the slot, picking it ends that share
   * - blocked: the user may not take the slot, picking it says why
   * - start: no extra entries, picking it starts a screen share
   * - menu: entries exist, picking it offers screen or an entry
   */
  let mode: 'stop' | 'blocked' | 'start' | 'menu' = entries.length > 0 ? 'menu' : 'start';
  if (isSharing) {
    mode = 'stop';
  } else if (!canShare) {
    mode = 'blocked';
  }

  let label = holder === 'local-screen' ? t('ScreenShare.StopConfirm') : t('ScreenShare.Share');
  if (activeEntry) {
    label = activeEntry.stopLabel;
  }
  const menuItems = [
    { command: 'screen', label: t('ScreenShare.StartConfirm'), icon: IconShare },
    ...entries.map(entry => ({ command: entry.command, label: entry.label, icon: entry.icon })),
  ];

  function stopShare() {
    if (activeEntry) {
      activeEntry.stop();
      return;
    }
    void stopScreenShare();
  }

  /** Picks the control in every mode but `menu`, which opens a list instead. */
  function activate() {
    if (mode === 'stop') {
      stopShare();
    } else if (mode === 'blocked') {
      ensureCanStart();
    } else {
      void startScreenShare();
    }
  }

  function runItem(command: string) {
    if (command === 'screen') {
      void startScreenShare();
      return;
    }
    entries.find(entry => entry.command === command)?.run();
  }

  const overflowBehavior: OverflowBehavior = mode === 'menu'
    ? {
      submenu: {
        title: t('ScreenShare.Share'),
        items: menuItems,
        // The slot may have been taken while the submenu stood open.
        run: (command) => {
          if (ensureCanStart()) {
            runItem(command);
          }
          return true;
        },
      },
    }
    : { select: activate };

  const [menuOpen, setMenuOpen] = useState(false);

  function onMenuOpen(open: boolean) {
    if (open && mode !== 'menu') {
      setMenuOpen(false);
      activate();
      return;
    }
    setMenuOpen(open);
  }

  function onCommand(command: string | number) {
    setMenuOpen(false);
    runItem(String(command));
  }

  return (
    <SCREEN_SHARE_ENTRY_KEY.Provider value={registry}>
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
            <TUIDropdownItem key={item.command} command={item.command}>
              <Icon className="screen-share-menu-icon" size={16} />
              {item.label}
            </TUIDropdownItem>
          );
        })}
      >
        <ToolbarButtonPC
          label={label}
          icon={IconShare}
          active={isSharing}
          blocked={mode === 'blocked'}
          loading={isBusy}
          notice={hasScreenFault}
          overflowBehavior={overflowBehavior}
        />
      </TUIDropdown>
      {children}
    </SCREEN_SHARE_ENTRY_KEY.Provider>
  );
}

export default ScreenShareButton;
