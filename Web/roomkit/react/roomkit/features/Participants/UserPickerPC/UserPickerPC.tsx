import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLoginState } from 'tuikit-atomicx-react/room';
import { TUIAvatar, TUIButton, TUIDialog, TUIInput, IconCheck, IconClose, IconSearch } from '../../../base';
import { useI18n } from '../../../i18n';
import { filterContacts, pickedContacts, selectedContacts, toggleSelectedId } from './contactPicker';
import type { PickedContact } from './contactPicker';
import { useResolvedContacts } from './useResolvedContacts';
import './UserPickerPC.scss';

const EMPTY_IDS: string[] = [];

export interface UserPickerPCProps {
  open: boolean;
  occupiedIds?: string[];
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

  const [query, setQuery] = useState('');
  const [pickedIds, setPickedIds] = useState(() => new Set<string>());
  const pickedRef = useRef<HTMLDivElement | null>(null);
  const { loginUserInfo } = useLoginState();
  const loginUserId = loginUserInfo?.userId;
  const occupiedIdSet = useMemo(() => new Set(occupiedIds), [occupiedIds]);
  const excludeIds = useMemo(() => (loginUserId ? [loginUserId] : []), [loginUserId]);
  const { contacts, refreshContacts } = useResolvedContacts(occupiedIdSet, excludeIds);

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const refreshContactsRef = useRef(refreshContacts);
  refreshContactsRef.current = refreshContacts;
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
    setPickedIds(new Set(selectedIdsRef.current));
    void refreshContactsRef.current();
  }, [open]);

  const visibleContacts = filterContacts(contacts, query);

  const picked = selectedContacts(pickedIds, contacts);

  const confirmText = pickedIds.size
    ? t('Participants.ConfirmCount', { count: pickedIds.size })
    : t('Participants.Confirm');

  function toggle(userId: string) {
    const contact = contacts.find(item => item.userId === userId);
    if (!contact) {
      return;
    }
    setPickedIds(toggleSelectedId(pickedIds, userId, contact.occupied));
    /* Chips wrap downwards, so keep the row that was just added in view. */
    requestAnimationFrame(() => {
      const element = pickedRef.current;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  function confirm() {
    onConfirm?.(pickedContacts([...pickedIds], contacts));
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
            modelValue={query}
            onUpdateModelValue={value => setQuery(String(value ?? ''))}
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
                  contact.occupied || pickedIds.has(contact.userId) ? 'sel' : '',
                  contact.occupied ? 'disabled' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => toggle(contact.userId)}
              >
                <TUIAvatar
                  className="invite-dialog-avatar"
                  size={32}
                  src={contact.avatarUrl}
                  alt={contact.userName}
                />
                <span className="invite-dialog-meta">
                  <span className="invite-dialog-name">{contact.userName}</span>
                  {contact.occupied && <span className="invite-dialog-sub">{t('Participants.ContactInvited')}</span>}
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
                {query.trim() ? t('Participants.ContactNotFound') : t('Participants.ContactEmpty')}
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
                  onClick={() => toggle(contact.userId)}
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
