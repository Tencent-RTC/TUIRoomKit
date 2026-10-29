import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import {
  TUIAvatar,
  TUIButton,
  TUIDialog,
  TUIInput,
  IconCheck,
  IconClose,
  IconSearch,
} from '../../../base';
import { useI18n } from '../../../i18n';
import { useContactPicker } from '../contactData';
import type { PickedContact } from '../contactData';
import './UserPickerPC.scss';
// The dialog shell is teleported, so its panel chrome has to be matched from outside the component.
import './UserPickerPC.global.scss';

const EMPTY_IDS: string[] = [];

export interface UserPickerPCProps {
  open: boolean;
  /** Ids already in the room or being called; shown checked and locked. Pass a memoised array. */
  occupiedIds?: string[];
  /** Ids preselected every time the picker opens. */
  selectedIds?: string[];
  onUpdateOpen?: (open: boolean) => void;
  onConfirm?: (users: PickedContact[]) => void;
  className?: string;
  style?: CSSProperties;
}

export function UserPickerPC(props: UserPickerPCProps) {
  const {
    open,
    occupiedIds = EMPTY_IDS,
    selectedIds = EMPTY_IDS,
    onUpdateOpen,
    onConfirm,
    className,
    style,
  } = props;
  const { t } = useI18n();

  const pickedRef = useRef<HTMLDivElement | null>(null);
  const {
    contacts,
    searchKeyword,
    setSearchKeyword,
    visibleContacts,
    picked,
    pickedCount,
    emptyText,
    isPicked,
    toggle,
    reset,
    pickedContacts,
  } = useContactPicker(occupiedIds);

  const confirmText = pickedCount
    ? t('Participants.ConfirmCount', { count: pickedCount })
    : t('Participants.Confirm');

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const resetRef = useRef(reset);
  resetRef.current = reset;
  const isFirstOpenRun = useRef(true);
  useEffect(() => {
    if (isFirstOpenRun.current) {
      isFirstOpenRun.current = false;
      return;
    }
    if (open) {
      resetRef.current(selectedIdsRef.current);
    }
  }, [open]);

  /* Chips wrap downwards, so keep the row that was just added in view. */
  function togglePick(userId: string) {
    toggle(userId);
    requestAnimationFrame(() => {
      const element = pickedRef.current;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  function confirm() {
    onConfirm?.(pickedContacts());
  }

  return (
    <div className={['invite-dialog', className ?? ''].filter(Boolean).join(' ')} style={style}>
      <TUIDialog
        open={open}
        title={t('Participants.ContactsTitle', { count: contacts.length })}
        width="420px"
        confirmText={confirmText}
        cancelText={t('Participants.Cancel')}
        closable
        onUpdateOpen={value => onUpdateOpen?.(value)}
        onConfirm={confirm}
      >
        <div className="invite-dialog-content">
          <TUIInput
            modelValue={searchKeyword}
            onUpdateModelValue={value => setSearchKeyword(String(value ?? ''))}
            className="invite-dialog-search"
            type="text"
            size="sm"
            clearable
            placeholder={t('Participants.SearchPlaceholder')}
            prefixSlot={<IconSearch size={14} />}
          />

          <div className="invite-dialog-list">
            {visibleContacts.map(contact => (
              <div
                key={contact.userId}
                className={[
                  'invite-dialog-row',
                  contact.occupied || isPicked(contact.userId) ? 'sel' : '',
                  contact.occupied ? 'disabled' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => togglePick(contact.userId)}
              >
                <TUIAvatar
                  className="invite-dialog-avatar"
                  size={32}
                  src={contact.avatarUrl}
                  alt={contact.userName}
                />
                <span className="invite-dialog-meta">
                  <span className="invite-dialog-name">{contact.userName}</span>
                  {contact.occupied && (
                    <span className="invite-dialog-sub">{t('Participants.ContactInvited')}</span>
                  )}
                </span>
                <span className="invite-dialog-check">
                  <span className="invite-dialog-check-icon">
                    <IconCheck size={11} />
                  </span>
                </span>
              </div>
            ))}
            {visibleContacts.length === 0 && (
              <div className="invite-dialog-empty">
                {emptyText}
              </div>
            )}
          </div>

          <div ref={pickedRef} className="invite-dialog-picked">
            {picked.map(contact => (
              <span key={contact.userId} className="invite-dialog-chip">
                <TUIAvatar
                  className="invite-dialog-chip-av"
                  size={20}
                  src={contact.avatarUrl}
                  alt={contact.userName}
                />
                <span className="invite-dialog-chip-name">{contact.userName}</span>
                <TUIButton
                  className="invite-dialog-chip-close"
                  variant="ghost"
                  size="sm"
                  aria-label={t('Participants.ContactDeselect', { name: contact.userName })}
                  onClick={() => togglePick(contact.userId)}
                >
                  <IconClose size={10} />
                </TUIButton>
              </span>
            ))}
          </div>
        </div>
      </TUIDialog>
    </div>
  );
}

export default UserPickerPC;
