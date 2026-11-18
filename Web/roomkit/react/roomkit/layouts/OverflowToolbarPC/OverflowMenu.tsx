import { useState } from 'react';
import {
  TUIDropdown,
  TUIDropdownItem,
  TUIDropdownSeparator,
  IconChevron,
  IconMaximize,
  IconMore,
  IconPip,
} from '../../base';
import { useI18n } from '../../i18n';
import ToolbarButtonPC from '../ToolbarButtonPC/ToolbarButtonPC';
import OverflowSubmenuPanel from './OverflowSubmenuPanel';
import { OVERFLOW_ITEM_KEY } from './overflowItem';
import type { OverflowMenuEntry } from './overflowItem';
import './OverflowMenu.scss';

// Namespaced so shell entries never collide with a toolbar entry id
const SHELL_COMMANDS = {
  minimize: 'shell:minimize',
  fullscreen: 'shell:fullscreen',
} as const;

export interface OverflowMenuProps {
  entries: OverflowMenuEntry[];
  fullscreen: boolean;
  minimizable?: boolean;
  onMinimize?: () => void;
  onFullscreen?: () => void;
}

export function OverflowMenu(props: OverflowMenuProps) {
  const {
    entries,
    fullscreen,
    minimizable,
    onMinimize,
    onFullscreen,
  } = props;

  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [drilledId, setDrilledId] = useState<string | null>(null);

  /** Read live, so a control that stops offering its submenu (a share starts) drops the drill. */
  const drilledBehavior = entries.find(entry => entry.id === drilledId)?.behavior;
  const submenu = drilledBehavior && 'submenu' in drilledBehavior ? drilledBehavior.submenu : null;

  function onOpen(next: boolean) {
    setOpen(next);
    setDrilledId(null);
  }

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

    const behavior = entries.find(entry => entry.id === id)?.behavior;
    if (behavior && 'select' in behavior) {
      void behavior.select();
    }
  }

  return (
    <TUIDropdown
      open={open}
      placement="top"
      onCommand={handleCommand}
      onUpdateOpen={onOpen}
      menuSlot={submenu
        ? (
          <OverflowSubmenuPanel
            submenu={submenu}
            onBack={() => setDrilledId(null)}
            onClose={() => onOpen(false)}
          />
        )
        : (
          <>
            {entries.map((entry) => {
              const EntryIcon = entry.icon;
              if ('submenu' in entry.behavior) {
                return (
                  <button
                    key={entry.id}
                    className="overflow-menu-entry"
                    type="button"
                    disabled={entry.disabled}
                    onClick={() => setDrilledId(entry.id)}
                  >
                    <span className="overflow-menu-icon">
                      {EntryIcon && <EntryIcon size={16} />}
                    </span>
                    <span className="overflow-menu-label">{entry.label}</span>
                    <IconChevron className="overflow-menu-chevron" size={12} />
                  </button>
                );
              }
              return (
                <TUIDropdownItem key={entry.id} command={entry.id} disabled={entry.disabled}>
                  <span className="overflow-menu-icon">
                    {EntryIcon && <EntryIcon size={16} />}
                  </span>
                  {entry.label}
                </TUIDropdownItem>
              );
            })}

            {entries.length > 0 && <TUIDropdownSeparator />}

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
      {/* The More button is the menu itself, not an item that can collapse into it. */}
      <OVERFLOW_ITEM_KEY.Provider value={null}>
        <ToolbarButtonPC
          label={t('Room.More')}
          icon={IconMore}
          active={open}
          aria-haspopup="menu"
          aria-expanded={open}
        />
      </OVERFLOW_ITEM_KEY.Provider>
    </TUIDropdown>
  );
}

export default OverflowMenu;
