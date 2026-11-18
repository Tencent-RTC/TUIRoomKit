import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useLoginState } from 'tuikit-atomicx-react/room';
import { IconClose, IconUserPlus, TUIAvatar, TUIButton, TUIDialog, TUIInput, TUIPopover, UserPickerPC, useI18n, useResolvedContacts } from '@tencentcloud/roomkit-web-react';
import type { PickedContact, PickerContact } from '@tencentcloud/roomkit-web-react';
import { CLASS_MODES } from '../../classMode';

interface MemberFieldProps {
  modelValue: PickedContact[];
  maxCount?: number;
  onUpdateModelValue: (users: PickedContact[]) => void;
}
export interface MemberFieldHandle {
  showMemberLimit: () => void;
}
const EMPTY_IDS: string[] = [];

const MemberField = forwardRef<MemberFieldHandle, MemberFieldProps>(({ modelValue, maxCount, onUpdateModelValue }, ref) => {
  const { t } = useI18n();
  const { loginUserInfo } = useLoginState();
  const selfId = loginUserInfo?.userId;
  const excludeIds = useMemo(() => selfId ? [selfId] : [], [selfId]);
  const { contacts, refreshContacts } = useResolvedContacts(EMPTY_IDS, excludeIds);
  const refreshContactsRef = useRef(refreshContacts);
  refreshContactsRef.current = refreshContacts;
  const fieldRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [isMemberLimitOpen, setMemberLimitOpen] = useState(false);
  const isSmallLimit = maxCount === CLASS_MODES.small.maxMembers;
  const keyword = query.trim().toLowerCase();
  const hits = !keyword
    ? []
    : contacts.filter(contact => !modelValue.some(user => user.userId === contact.userId)
      && (contact.userName.toLowerCase().includes(keyword) || contact.userId.toLowerCase().includes(keyword)));
  const selectedIds = useMemo(() => modelValue.map(user => user.userId), [modelValue]);

  useEffect(() => {
    refreshContactsRef.current();
  }, []);
  useImperativeHandle(ref, () => ({ showMemberLimit: () => setMemberLimitOpen(true) }), []);

  function pick(contact: PickerContact) {
    onUpdateModelValue([...modelValue, { userId: contact.userId, userName: contact.userName }]);
    setQuery('');
    setMenuOpen(false);
  }
  function handlePicked(users: PickedContact[]) {
    if (maxCount !== undefined && users.length > maxCount) {
      setMemberLimitOpen(true);
      return;
    }
    onUpdateModelValue(users);
    setPickerOpen(false);
  }

  return (
    <div className="preclass-member">
      <TUIPopover
        open={isMenuOpen}
        onUpdateOpen={(isOpen) => {
          if (!isOpen) setMenuOpen(false);
        }}
        placement="bottom-start"
        offset={4}
        padded={false}
        contentSlot={(
          <div className="preclass-member-menu" style={{ width: fieldRef.current?.offsetWidth }}>
            {!hits.length && <p className="preclass-member-empty">{t('Schedule.AttendeeEmpty')}</p>}
            {hits.map(hit => (
              <button key={hit.userId} type="button" className="preclass-member-hit" onClick={() => pick(hit)}>
                <TUIAvatar size={20} src={hit.avatarUrl} alt={hit.userName} />
                <b>{hit.userName}</b>
              </button>
            ))}
          </div>
        )}
      >
        <div ref={fieldRef} className="preclass-member-field">
          <TUIInput
            modelValue={query}
            onUpdateModelValue={(value) => {
              const next = String(value ?? '');
              setQuery(next);
              setMenuOpen(!!next.trim());
            }}
            className="preclass-member-input"
            type="text"
            clearable
            placeholder={t('Schedule.ParticipantsPlaceholder')}
            aria-label={t('Preclass.Members')}
            onFocus={() => setMenuOpen(!!query.trim())}
            onEnter={() => {
              if (hits.length === 1) pick(hits[0]);
            }}
            suffixSlot={(
              <TUIButton
                className="preclass-member-add"
                variant="ghost"
                size="sm"
                title={t('Schedule.PickContacts')}
                aria-label={t('Schedule.PickContacts')}
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  setPickerOpen(true);
                }}
              >
                <IconUserPlus size={16} />
              </TUIButton>
            )}
          />
        </div>
      </TUIPopover>
      {!!modelValue.length && (
        <div className="preclass-member-chips">
          {modelValue.map(user => (
            <span key={user.userId} className="preclass-member-chip">
              <TUIAvatar size={18} src={contacts.find(contact => contact.userId === user.userId)?.avatarUrl ?? ''} alt={user.userName} />
              <b>{user.userName}</b>
              <button type="button" className="preclass-member-remove" aria-label={t('Schedule.RemoveParticipant', { userId: user.userName })} onClick={() => onUpdateModelValue(modelValue.filter(member => member.userId !== user.userId))}><IconClose size={10} /></button>
            </span>
          ))}
          <span className="preclass-member-count">{t('Schedule.AttendeeCount', { count: modelValue.length })}</span>
        </div>
      )}
      <UserPickerPC open={isPickerOpen} onUpdateOpen={setPickerOpen} mode="schedule" selectedIds={selectedIds} onConfirm={handlePicked} />
      <TUIDialog open={isMemberLimitOpen} onUpdateOpen={setMemberLimitOpen} width="380px" title={t(isSmallLimit ? 'Preclass.SmallMemberTitle' : 'Preclass.OneMemberTitle')} confirmText={t('Preclass.GotIt')} cancelText="" onConfirm={() => setMemberLimitOpen(false)}>
        {t(isSmallLimit ? 'Preclass.SmallMember' : 'Preclass.OneMember')}
      </TUIDialog>
    </div>
  );
});
MemberField.displayName = 'MemberField';
export default MemberField;
