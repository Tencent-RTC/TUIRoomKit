import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { ContactStoreRaw, useContactListState } from 'tuikit-atomicx-react/chat';
import { useLoginState } from 'tuikit-atomicx-react/room';
import {
  IconCheck,
  IconChevron,
  IconSearch,
  TUIAvatar,
  TUIInput,
  TUIPopup,
  loadContactList,
} from '../../../base';
import type { RoomKitContact } from '../../../base';
import { useI18n } from '../../../i18n';
import './UserPickerMobile.scss';

// TODO(react-next): `useContactStore` is not exported from tuikit-atomicx-react/chat;
// the raw ContactStore singleton it wraps exposes the same loadFriends.
const { loadFriends } = ContactStoreRaw;

const EMPTY_IDS: string[] = [];

export interface PickedContactMobile {
  userId: string;
  userName: string;
}

export interface UserPickerMobileProps {
  open: boolean;
  occupiedIds?: string[];
  onUpdateOpen?: (open: boolean) => void;
  onConfirm?: (contacts: PickedContactMobile[]) => void;
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

  const { friendList } = useContactListState();
  const { loginUserInfo } = useLoginState();

  const [query, setQuery] = useState('');
  const [pickedIds, setPickedIds] = useState(() => new Set<string>());
  const [pickedView, setPickedView] = useState(false);

  const occupiedIdSet = useMemo(() => new Set(occupiedIds), [occupiedIds]);

  /** Set when the host supplies `contactList`; those contacts bypass the IM friend list. */
  const [hostContacts, setHostContacts] = useState<RoomKitContact[] | null>(null);

  const contacts = useMemo(() => {
    const selfId = loginUserInfo?.userId;
    if (hostContacts) {
      return hostContacts
        .filter(contact => contact.userId !== selfId)
        .map(contact => ({
          userId: contact.userId,
          userName: (contact.userName || contact.userId).trim(),
          avatarUrl: contact.avatarUrl || '',
        }));
    }
    return friendList
      .filter(friend => friend.userID && friend.userID !== selfId)
      .map(friend => ({
        userId: friend.userID,
        userName: (friend.remark || friend.nick || friend.userID).trim(),
        avatarUrl: friend.avatar || '',
      }));
  }, [friendList, hostContacts, loginUserInfo?.userId]);

  const visibleContacts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return contacts;
    }
    return contacts.filter(contact => (
      contact.userName.toLowerCase().includes(keyword) || contact.userId.toLowerCase().includes(keyword)
    ));
  }, [contacts, query]);

  /** Selection order, so the newest face lands at the end of the strip. */
  const picked = useMemo(() => {
    const byId = new Map(contacts.map(contact => [contact.userId, contact]));
    return [...pickedIds].flatMap((userId) => {
      const contact = byId.get(userId);
      return contact ? [contact] : [];
    });
  }, [contacts, pickedIds]);

  const facesRef = useRef<HTMLDivElement | null>(null);
  const [facesScrolled, setFacesScrolled] = useState(false);

  function syncFacesEdge() {
    setFacesScrolled((facesRef.current?.scrollLeft ?? 0) > 0);
  }

  const pickedCount = picked.length;
  const prevPickedCount = useRef(pickedCount);
  useEffect(() => {
    if (pickedCount <= prevPickedCount.current) {
      prevPickedCount.current = pickedCount;
      return;
    }
    prevPickedCount.current = pickedCount;
    requestAnimationFrame(() => {
      const faces = facesRef.current;
      if (faces) {
        faces.scrollLeft = faces.scrollWidth;
        syncFacesEdge();
      }
    });
  }, [pickedCount]);

  const isFirstOpenRun = useRef(true);
  useEffect(() => {
    if (isFirstOpenRun.current) {
      isFirstOpenRun.current = false;
      return;
    }
    if (!open) {
      return;
    }
    setQuery('');
    setPickedIds(new Set());
    setPickedView(false);
    setFacesScrolled(false);
    void loadContactList().then((provided) => {
      setHostContacts(provided ?? null);
      if (provided) {
        return;
      }
      loadFriends().catch((error: unknown) => {
        console.error('[RoomKit.participant] Failed to load friends:', error);
      });
    });
  }, [open]);

  useEffect(() => {
    if (pickedCount === 0) {
      setPickedView(false);
    }
  }, [pickedCount]);

  function toggle(userId: string) {
    if (occupiedIdSet.has(userId)) {
      return;
    }
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function confirm() {
    if (picked.length === 0) {
      return;
    }
    onConfirm?.(picked.map(({ userId, userName }) => ({ userId, userName })));
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
              onKeyDown={event => onEnterKeyDown(event, () => onUpdateOpen?.(false))}
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
              onKeyDown={event => onEnterKeyDown(event, confirm)}
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
              onKeyDown={event => onEnterKeyDown(event, () => setPickedView(false))}
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
              modelValue={query}
              onUpdateModelValue={value => setQuery(String(value ?? ''))}
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
            {visibleContacts.map(contact => (
              <div
                key={contact.userId}
                className={['user-picker-mobile-row', occupiedIdSet.has(contact.userId) ? 'is-occupied' : ''].filter(Boolean).join(' ')}
                role="checkbox"
                aria-checked={pickedIds.has(contact.userId)}
                aria-disabled={occupiedIdSet.has(contact.userId)}
                tabIndex={0}
                onClick={() => toggle(contact.userId)}
              >
                <TUIAvatar size={32} src={contact.avatarUrl} alt={contact.userName} />
                <div className="user-picker-mobile-info">
                  <span className="user-picker-mobile-name">{contact.userName}</span>
                  {occupiedIdSet.has(contact.userId) && (
                    <span className="user-picker-mobile-sub">
                      {t('Participants.ContactInvited')}
                    </span>
                  )}
                </div>
                <span
                  className={['user-picker-mobile-check', pickedIds.has(contact.userId) || occupiedIdSet.has(contact.userId) ? 'is-checked' : ''].filter(Boolean).join(' ')}
                >
                  {(pickedIds.has(contact.userId) || occupiedIdSet.has(contact.userId)) && <IconCheck size={12} />}
                </span>
              </div>
            ))}
            {visibleContacts.length === 0 && (
              <div className="user-picker-mobile-empty">
                {query.trim() ? t('Participants.ContactNotFound') : t('Participants.ContactEmpty')}
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
                  onKeyDown={event => onEnterKeyDown(event, () => toggle(contact.userId))}
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
