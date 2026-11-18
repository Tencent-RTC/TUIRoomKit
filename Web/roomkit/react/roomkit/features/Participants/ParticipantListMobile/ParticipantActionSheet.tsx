import type { KeyboardEvent } from 'react';
import { TUIPopup } from '../../../base';
import type { ParticipantSheetItem } from '../participantData';
import './ParticipantActionSheet.scss';

export interface ParticipantActionSheetProps {
  open: boolean;
  groups: ParticipantSheetItem[][];
  /** Rule between rows, for the host's text-only list. */
  split?: boolean;
  onUpdateOpen?: (open: boolean) => void;
  onSelect?: (key: string) => void;
}

export function ParticipantActionSheet(props: ParticipantActionSheetProps) {
  const { open, groups, split = false, onUpdateOpen, onSelect } = props;

  function onItemKeyDown(event: KeyboardEvent<HTMLDivElement>, key: string) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    onSelect?.(key);
  }

  return (
    <TUIPopup open={open} height="auto" onUpdateOpen={value => onUpdateOpen?.(value)}>
      <div className="participant-action-sheet" role="menu">
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
                  onClick={() => onSelect?.(item.key)}
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
