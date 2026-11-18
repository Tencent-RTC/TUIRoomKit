import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import {
  IconCheck,
  IconChevron,
  IconSearch,
  TUIAvatar,
  TUIInput,
  TUIPopup,
} from '../../../base';
import { useI18n } from '../../../i18n';
import { useContactPicker } from '../contactData';
import type { PickedContact } from '../contactData';
import './UserPickerMobile.scss';

const EMPTY_IDS: string[] = [];

export interface UserPickerMobileProps {
  open: boolean;
  /** Ids already in the room or being called; shown checked and locked. Pass a memoised array. */
  occupiedIds?: string[];
  onUpdateOpen?: (open: boolean) => void;
  onConfirm?: (contacts: PickedContact[]) => void;
  className?: string;
  style?: CSSProperties;
}

export function UserPickerMobile(props: UserPickerMobileProps) {
  const {
    open,
    occupiedIds = EMPTY_IDS,
    onUpdateOpen,
    onConfirm,
    className,
    style,
  } = props;
  const { t } = useI18n();

  const [pickedView, setPickedView] = useState(false);
  const facesRef = useRef<HTMLDivElement | null>(null);
  const [facesScrolled, setFacesScrolled] = useState(false);
  const {
    searchKeyword,
    setSearchKeyword,
    visibleContacts,
    picked,
    emptyText,
    isPicked,
    toggle,
    reset,
    pickedContacts,
  } = useContactPicker(occupiedIds);

  function syncFacesEdge() {
    setFacesScrolled((facesRef.current?.scrollLeft ?? 0) > 0);
  }

  /* Keep the newest face in view at the end of the strip. */
  const pickedCount = picked.length;
  const previousCountRef = useRef(pickedCount);
  useLayoutEffect(() => {
    const previous = previousCountRef.current;
    previousCountRef.current = pickedCount;
    if (pickedCount === 0) {
      setPickedView(false);
    }
    if (pickedCount <= previous) {
      return;
    }
    const faces = facesRef.current;
    if (faces) {
      faces.scrollLeft = faces.scrollWidth;
      syncFacesEdge();
    }
  }, [pickedCount]);

  const resetRef = useRef(reset);
  resetRef.current = reset;
  useEffect(() => {
    if (!open) {
      return;
    }
    setPickedView(false);
    setFacesScrolled(false);
    resetRef.current();
  }, [open]);

  function confirm() {
    if (picked.length > 0) {
      onConfirm?.(pickedContacts());
    }
  }

  function onEnterKeyDown(event: KeyboardEvent<HTMLDivElement>, action: () => void) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    action();
  }

  return (
    <TUIPopup
      open={open}
      height="84%"
      closable={false}
      onUpdateOpen={value => onUpdateOpen?.(value)}
      headerSlot={(
        <div className={['user-picker-mobile-header', pickedView ? 'is-picked-view' : ''].filter(Boolean).join(' ')}>
          <div className="user-picker-mobile-bar" aria-hidden={pickedView}>
            <div
              className="user-picker-mobile-bar-btn is-start"
              role="button"
              tabIndex={0}
              onClick={() => onUpdateOpen?.(false)}
            >
              {t('Participants.Cancel')}
            </div>
            <span className="user-picker-mobile-bar-title">{t('UserPicker.Title')}</span>
            <div
              className={['user-picker-mobile-bar-btn is-end is-primary', picked.length === 0 ? 'is-disabled' : ''].filter(Boolean).join(' ')}
              role="button"
              tabIndex={picked.length ? 0 : -1}
              aria-disabled={picked.length === 0}
              onClick={confirm}
            >
              {picked.length ? t('UserPicker.InviteCount', { count: picked.length }) : t('UserPicker.Invite')}
            </div>
          </div>
          <div className="user-picker-mobile-bar is-picked" aria-hidden={!pickedView}>
            <div
              className="user-picker-mobile-bar-btn is-start"
              role="button"
              tabIndex={0}
              onClick={() => setPickedView(false)}
            >
              <IconChevron className="user-picker-mobile-back-chev" size={16} />
              <span>{t('UserPicker.Back')}</span>
            </div>
            <span className="user-picker-mobile-bar-title">
              {t('UserPicker.SelectedCount', { count: picked.length })}
            </span>
          </div>
        </div>
      )}
    >
      <div className={['user-picker-mobile', pickedView ? 'is-picked-view' : '', className ?? ''].filter(Boolean).join(' ')} style={style}>
        <div className="user-picker-mobile-page" aria-hidden={pickedView}>
          <div className="user-picker-mobile-toolbar">
            <TUIInput
              modelValue={searchKeyword}
              onUpdateModelValue={value => setSearchKeyword(String(value ?? ''))}
              className="user-picker-mobile-search"
              size="sm"
              placeholder={t('Participants.SearchPlaceholder')}
              prefixSlot={<IconSearch className="user-picker-mobile-search-icon" size={14} />}
            />
          </div>

          {picked.length > 0 && (
            <div
              className="user-picker-mobile-selected"
              role="button"
              tabIndex={0}
              onClick={() => setPickedView(true)}
              onKeyDown={event => onEnterKeyDown(event, () => setPickedView(true))}
            >
              <span className="user-picker-mobile-selected-count">
                {t('UserPicker.SelectedCount', { count: picked.length })}
              </span>
              <div
                ref={facesRef}
                className={['user-picker-mobile-selected-faces', facesScrolled ? 'is-scrolled' : ''].filter(Boolean).join(' ')}
                onScroll={syncFacesEdge}
              >
                {picked.map(contact => (
                  <TUIAvatar
                    key={contact.userId}
                    className="user-picker-mobile-selected-avatar"
                    size={28}
                    src={contact.avatarUrl}
                    alt={contact.userName}
                  />
                ))}
              </div>
              <IconChevron className="user-picker-mobile-selected-chev" size={16} />
            </div>
          )}

          <div className="user-picker-mobile-list">
            {visibleContacts.map((contact) => {
              const checked = isPicked(contact.userId) || contact.occupied;
              return (
                <div
                  key={contact.userId}
                  className={['user-picker-mobile-row', contact.occupied ? 'is-occupied' : ''].filter(Boolean).join(' ')}
                  role="checkbox"
                  aria-checked={isPicked(contact.userId)}
                  aria-disabled={contact.occupied}
                  tabIndex={0}
                  onClick={() => toggle(contact.userId)}
                >
                  <TUIAvatar size={32} src={contact.avatarUrl} alt={contact.userName} />
                  <div className="user-picker-mobile-info">
                    <span className="user-picker-mobile-name">{contact.userName}</span>
                    {contact.occupied && (
                      <span className="user-picker-mobile-sub">
                        {t('Participants.ContactInvited')}
                      </span>
                    )}
                  </div>
                  <span className={['user-picker-mobile-check', checked ? 'is-checked' : ''].filter(Boolean).join(' ')}>
                    {checked && <IconCheck size={12} />}
                  </span>
                </div>
              );
            })}
            {visibleContacts.length === 0 && (
              <div className="user-picker-mobile-empty">
                {emptyText}
              </div>
            )}
          </div>
        </div>

        <div className="user-picker-mobile-page is-picked" aria-hidden={!pickedView}>
          <div className="user-picker-mobile-list">
            {picked.map(contact => (
              <div key={contact.userId} className="user-picker-mobile-row is-static">
                <TUIAvatar size={32} src={contact.avatarUrl} alt={contact.userName} />
                <div className="user-picker-mobile-info">
                  <span className="user-picker-mobile-name">{contact.userName}</span>
                </div>
                <div
                  className="user-picker-mobile-remove"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(contact.userId)}
                >
                  {t('UserPicker.Remove')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TUIPopup>
  );
}

export default UserPickerMobile;
