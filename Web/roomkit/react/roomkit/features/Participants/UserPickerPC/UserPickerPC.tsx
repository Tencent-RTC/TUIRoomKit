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
import type { PickedContact, PickerContact } from '../contactData';
import './UserPickerPC.scss';
// The dialog shell is teleported, so its panel chrome has to be matched from outside the component.
import './UserPickerPC.global.scss';

const EMPTY_IDS: string[] = [];

export interface UserPickerPCProps {
  open: boolean;
  /** Schedule collects attendees and permits an empty confirmation. */
  mode?: 'meeting' | 'schedule';
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
  const mainRef = useRef<HTMLDivElement | null>(null);
  const sideListRef = useRef<HTMLDivElement | null>(null);
  const {
    searchKeyword,
    setSearchKeyword,
    visibleContacts,
    picked,
    emptyText,
    isPicked,
    toggle,
    reset,
    clear,
    pickedContacts,
  } = useContactPicker(occupiedIds);

  const isMeeting = props.mode !== 'schedule';
  let confirmText = t('Participants.Confirm');
  if (isMeeting) {
    confirmText = picked.length ? t('UserPicker.InviteCount', { count: picked.length }) : t('UserPicker.Invite');
  }

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const resetRef = useRef(reset);
  resetRef.current = reset;
  useEffect(() => {
    if (!open) return undefined;
    resetRef.current(selectedIdsRef.current);
    // The dialog focuses its panel one frame after opening; focus the input on the next frame.
    let focusFrame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(() => {
        mainRef.current?.querySelector<HTMLInputElement>('.user-picker-pc-search input')?.focus();
      });
    });
    return () => cancelAnimationFrame(focusFrame);
  }, [open]);

  function pick(contact: PickerContact) {
    if (contact.occupied) return;
    const adding = !isPicked(contact.userId);
    toggle(contact.userId);
    if (adding) {
      requestAnimationFrame(() => {
        const element = sideListRef.current;
        if (element) element.scrollTop = element.scrollHeight;
      });
    }
  }

  return (
    <div className={['invite-dialog', className ?? ''].filter(Boolean).join(' ')} style={style}>
      <TUIDialog
        open={open}
        title={t('UserPicker.Title')}
        width="min(640px, calc(100% - 32px))"
        confirmText={confirmText}
        confirmDisabled={isMeeting && !picked.length}
        cancelText={t('Participants.Cancel')}
        closable
        onUpdateOpen={value => onUpdateOpen?.(value)}
        onConfirm={() => onConfirm?.(pickedContacts())}
      >
        <div className="user-picker-pc">
          <div ref={mainRef} className="user-picker-pc-main">
            <TUIInput
              modelValue={searchKeyword}
              onUpdateModelValue={value => setSearchKeyword(String(value ?? ''))}
              className="user-picker-pc-search"
              type="text"
              size="sm"
              clearable
              placeholder={t('Participants.SearchPlaceholder')}
              prefixSlot={<IconSearch size={14} />}
            />
            <div
              className="user-picker-pc-list"
              role="listbox"
              aria-multiselectable="true"
              aria-label={t('UserPicker.Title')}
            >
              {visibleContacts.map(contact => (
                <div
                  key={contact.userId}
                  className={[
                    'user-picker-pc-row',
                    isPicked(contact.userId) ? 'is-selected' : '',
                    contact.occupied ? 'is-disabled' : '',
                  ].filter(Boolean).join(' ')}
                  role="option"
                  aria-selected={isPicked(contact.userId)}
                  aria-disabled={contact.occupied || undefined}
                  tabIndex={contact.occupied ? -1 : 0}
                  onClick={() => pick(contact)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      pick(contact);
                    }
                  }}
                >
                  <TUIAvatar className="user-picker-pc-avatar" size={32} src={contact.avatarUrl} alt={contact.userName} />
                  <div className="user-picker-pc-meta">
                    <div className="user-picker-pc-name">{contact.userName}</div>
                    {contact.occupied && (
                      <div className="user-picker-pc-sub">{t('Participants.ContactInvited')}</div>
                    )}
                  </div>
                  <div className="user-picker-pc-check"><IconCheck size={10} /></div>
                </div>
              ))}
              {!visibleContacts.length && <div className="user-picker-pc-empty">{emptyText}</div>}
            </div>
          </div>
          <div className="user-picker-pc-side">
            <div className="user-picker-pc-side-head">
              <span className="user-picker-pc-side-count">{t('UserPicker.SelectedCount', { count: picked.length })}</span>
              <TUIButton className="user-picker-pc-clear" variant="ghost" size="sm" disabled={!picked.length} onClick={clear}>
                {t('UserPicker.Clear')}
              </TUIButton>
            </div>
            <div ref={sideListRef} className="user-picker-pc-side-list">
              {picked.map(contact => (
                <div key={contact.userId} className="user-picker-pc-side-row">
                  <TUIAvatar className="user-picker-pc-avatar" size={32} src={contact.avatarUrl} alt={contact.userName} />
                  <div className="user-picker-pc-name">{contact.userName}</div>
                  <TUIButton
                    className="user-picker-pc-remove"
                    variant="ghost"
                    size="sm"
                    aria-label={t('Participants.ContactDeselect', { name: contact.userName })}
                    onClick={() => toggle(contact.userId)}
                  >
                    <IconClose size={10} />
                  </TUIButton>
                </div>
              ))}
            </div>
            {!picked.length && <div className="user-picker-pc-side-empty">{t('UserPicker.PickedEmpty')}</div>}
          </div>
        </div>
      </TUIDialog>
    </div>
  );
}

export default UserPickerPC;
