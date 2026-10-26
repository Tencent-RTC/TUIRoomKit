import type { ComponentType, CSSProperties, KeyboardEvent } from 'react';
import { TUIPopup } from '../../../base';
import type { IconProps } from '../../../base';
import './ParticipantActionSheet.scss';

export interface ParticipantActionItem {
  key: string;
  label: string;
  /** Member actions carry an icon; the host's room-wide toggles are text only. */
  icon?: ComponentType<IconProps>;
  danger?: boolean;
  /** A room-wide toggle that is currently on reads in the accent colour. */
  active?: boolean;
}

export interface ParticipantActionSheetProps {
  open: boolean;
  groups: ParticipantActionItem[][];
  /** Rule between rows, for the host's text-only list. */
  split?: boolean;
  onSelect?: (key: string) => void;
  onUpdateOpen?: (open: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

export function ParticipantActionSheet(props: ParticipantActionSheetProps) {
  const { open, groups, split = false, onSelect, onUpdateOpen, className, style } = props;

  function select(key: string) {
    onSelect?.(key);
  }

  function onItemKeyDown(event: KeyboardEvent<HTMLDivElement>, key: string) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    select(key);
  }

  return (
    <TUIPopup open={open} height="auto" onUpdateOpen={value => onUpdateOpen?.(value)}>
      <div
        className={['participant-action-sheet', className ?? ''].filter(Boolean).join(' ')}
        style={style}
        role="menu"
      >
        {groups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className={['participant-action-sheet-group', split ? 'is-split' : ''].filter(Boolean).join(' ')}
          >
            {group.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.key}
                  className={[
                    'participant-action-sheet-item',
                    item.danger ? 'is-danger' : '',
                    item.active ? 'is-active' : '',
                  ].filter(Boolean).join(' ')}
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => select(item.key)}
                  onKeyDown={event => onItemKeyDown(event, item.key)}
                >
                  {ItemIcon && <ItemIcon size={15} />}
                  <span className="participant-action-sheet-label">{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </TUIPopup>
  );
}

export default ParticipantActionSheet;
