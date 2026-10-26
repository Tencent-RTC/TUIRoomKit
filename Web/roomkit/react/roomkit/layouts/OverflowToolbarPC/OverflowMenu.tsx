import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { RecordingStatus, useRoomState } from 'tuikit-atomicx-react/room';
import {
  TUIDropdown,
  TUIDropdownItem,
  TUIDropdownSeparator,
  IconAISubtitles,
  IconChat,
  IconChevron,
  IconInfo,
  IconMaximize,
  IconMembers,
  IconMore,
  IconPip,
  IconRecord,
  IconRecording,
  IconSettings,
  IconShare,
  IconShareStop,
} from '../../base';
import type { IconProps } from '../../base';
import { useI18n } from '../../i18n';
import { useScreenShare } from '../../features/ScreenShare/ScreenShareButton/useScreenShare';
import ToolbarButtonPC from '../ToolbarButtonPC/ToolbarButtonPC';
import type { OverflowSubmenu } from './overflowSubmenu';
import type { OverflowMenuEntry } from './useToolbarOverflow';
import './OverflowMenu.scss';

// Namespaced so shell entries never collide with a toolbar action id
const SHELL_COMMANDS = {
  minimize: 'shell:minimize',
  fullscreen: 'shell:fullscreen',
} as const;

export interface OverflowMenuProps {
  actions: OverflowMenuEntry[];
  submenu?: OverflowSubmenu | null;
  fullscreen: boolean;
  minimizable?: boolean;
  onAction?: (id: string) => void;
  onDrill?: (id: string) => void;
  onLeave?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onFullscreen?: () => void;
  onOpen?: () => void;
}

interface OverflowMenuItem {
  id: string;
  label: string;
  icon?: ComponentType<IconProps>;
  danger?: boolean;
  active?: boolean;
  hasSubmenu?: boolean;
}

export function OverflowMenu(props: OverflowMenuProps) {
  const {
    actions,
    submenu,
    fullscreen,
    minimizable,
    onAction,
    onDrill,
    onLeave,
    onClose,
    onMinimize,
    onFullscreen,
    onOpen: emitOpen,
  } = props;

  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const backRef = useRef<HTMLButtonElement | null>(null);
  const { isLocalSharing } = useScreenShare();
  const { currentRoom } = useRoomState();
  const isRecording = currentRoom?.recordingInfo?.status === RecordingStatus.Recording;

  function matches(label: string, ...keys: string[]) {
    return keys.some(key => t(key) === label);
  }

  function iconFor(label: string): ComponentType<IconProps> | undefined {
    const icons: Array<[string, ComponentType<IconProps>]> = [
      [t('Participants.Panel'), IconMembers],
      [t('Chat.Title'), IconChat],
      [t('AITools.Entry'), IconAISubtitles],
      [t('Settings.Title'), IconSettings],
    ];
    return icons.find(([text]) => text === label)?.[1];
  }

  function resolveItem(action: OverflowMenuEntry): OverflowMenuItem {
    if (matches(action.label, 'ScreenShare.Share', 'ScreenShare.Stop')) {
      return {
        ...action,
        label: t(isLocalSharing ? 'ScreenShare.Stop' : 'ScreenShare.Share'),
        icon: isLocalSharing ? IconShareStop : IconShare,
        active: isLocalSharing,
      };
    }
    if (matches(action.label, 'CloudRecording.RecordLabel', 'CloudRecording.RecordingLabel')) {
      return {
        ...action,
        label: t(isRecording ? 'CloudRecording.RecordingLabel' : 'CloudRecording.RecordLabel'),
        icon: isRecording ? IconRecording : IconRecord,
        active: isRecording,
        danger: isRecording,
      };
    }
    return {
      ...action,
      icon: iconFor(action.label),
    };
  }

  const menuItems = actions.map(resolveItem);

  function onUpdateOpen(next: boolean) {
    setOpen(next);
    if (next) {
      emitOpen?.();
      return;
    }
    onClose?.();
  }

  function runSubmenu(act?: string) {
    if (!act || !submenu?.run(act)) {
      return;
    }
    setOpen(false);
    onClose?.();
  }

  const hadSubmenu = useRef(false);
  useEffect(() => {
    const hasSubmenu = Boolean(submenu);
    if (hasSubmenu && !hadSubmenu.current && open) {
      backRef.current?.focus();
    }
    hadSubmenu.current = hasSubmenu;
  }, [submenu, open]);

  function handleCommand(command: string | number) {
    const id = String(command);

    if (id === SHELL_COMMANDS.minimize) {
      onMinimize?.();
      return;
    }
    if (id === SHELL_COMMANDS.fullscreen) {
      onFullscreen?.();
      return;
    }

    onAction?.(id);
  }

  return (
    <TUIDropdown
      open={open}
      placement="top"
      onCommand={handleCommand}
      onUpdateOpen={onUpdateOpen}
      menuSlot={submenu
        ? (
          <div className="overflow-menu-sub">
            <button
              ref={backRef}
              className="overflow-menu-back"
              type="button"
              onClick={() => onLeave?.()}
            >
              <IconChevron className="overflow-menu-back-icon" size={12} />
              <span>{submenu.title}</span>
            </button>
            <div className="overflow-menu-sub-split" />
            {submenu.hint && (
              <div className="overflow-menu-sub-hint" role="note">
                <IconInfo size={14} />
                <span>{submenu.hint}</span>
              </div>
            )}
            {submenu.items.map((item, index) => (
              item.divider
                ? <div key={`split-${index}`} className="overflow-menu-sub-split" />
                : (
                  <button
                    key={item.act ?? `item-${index}`}
                    className={['overflow-menu-sub-item', item.on ? 'is-on' : ''].filter(Boolean).join(' ')}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => runSubmenu(item.act)}
                  >
                    {item.icon && <item.icon size={14} />}
                    <span>{item.label}</span>
                  </button>
                )
            ))}
          </div>
        )
        : (
          <>
            {menuItems.map((item) => {
              const ItemIcon = item.icon;
              if (item.hasSubmenu) {
                return (
                  <button
                    key={item.id}
                    className="overflow-menu-entry"
                    type="button"
                    onClick={() => onDrill?.(item.id)}
                  >
                    <span className="overflow-menu-icon">
                      {ItemIcon && <ItemIcon size={16} />}
                    </span>
                    <span className="overflow-menu-label">{item.label}</span>
                    <IconChevron className="overflow-menu-chevron" size={12} />
                  </button>
                );
              }
              return (
                <TUIDropdownItem
                  key={item.id}
                  command={item.id}
                  className={[
                    item.active ? 'overflow-menu-item-active' : '',
                    item.danger ? 'overflow-menu-item-danger' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="overflow-menu-icon">
                    {ItemIcon && <ItemIcon size={16} />}
                  </span>
                  {item.label}
                </TUIDropdownItem>
              );
            })}

            {menuItems.length > 0 && <TUIDropdownSeparator />}

            {minimizable && (
              <TUIDropdownItem command={SHELL_COMMANDS.minimize}>
                <span className="overflow-menu-icon">
                  <IconPip size={16} />
                </span>
                {t('Room.Pip')}
              </TUIDropdownItem>
            )}
            <TUIDropdownItem command={SHELL_COMMANDS.fullscreen}>
              <span className="overflow-menu-icon">
                <IconMaximize size={16} />
              </span>
              {fullscreen ? t('Room.ExitFullscreen') : t('Room.Fullscreen')}
            </TUIDropdownItem>
          </>
        )}
    >
      <ToolbarButtonPC
        label={t('Room.More')}
        icon={IconMore}
        active={open}
        aria-haspopup="menu"
        aria-expanded={open}
      />
    </TUIDropdown>
  );
}

export default OverflowMenu;
