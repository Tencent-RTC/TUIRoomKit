import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLoginState } from 'tuikit-atomicx-react/room';
import {
  IconClose,
  IconUserPlus,
  TUIAvatar,
  TUIButton,
  TUIInput,
  useFloating,
  useOverlay,
} from '../../../base';
import { useI18n } from '../../../i18n';
import UserPickerPC from '../../Participants/UserPickerPC/UserPickerPC';
import { useResolvedContacts } from '../../Participants/contactData';
import type { PickedContact } from '../../Participants/contactData';
import { attendeeChipLabel, attendeeSearchHits, uniqueParticipantIds } from './scheduleForm';
import type { AttendeeHit } from './scheduleForm';
import './ScheduleAttendeeField.scss';

export interface ScheduleAttendeeFieldProps {
  modelValue: string[];
  knownNames?: Record<string, string>;
  onUpdateModelValue?: (value: string[]) => void;
}

export interface ScheduleAttendeeFieldExpose {
  flushInput: () => boolean;
}

const NO_OCCUPIED_IDS: string[] = [];
const NO_KNOWN_NAMES: Record<string, string> = {};

export const ScheduleAttendeeField = forwardRef<ScheduleAttendeeFieldExpose, ScheduleAttendeeFieldProps>(
  (props, ref) => {
    const {
      modelValue,
      knownNames = NO_KNOWN_NAMES,
      onUpdateModelValue,
    } = props;
    const { t } = useI18n();

    const participantId = `meeting-participant-${useId()}`;
    const [participant, setParticipant] = useState('');
    const [attendeeMenuOpen, setAttendeeMenuOpenState] = useState(false);
    const [attendeeHits, setAttendeeHitsState] = useState<AttendeeHit[]>([]);
    const [contactsOpen, setContactsOpen] = useState(false);
    const [attendeeNames, setAttendeeNamesState] = useState(() => new Map<string, string>());
    const [menuWidth, setMenuWidth] = useState(0);
    const { loginUserInfo } = useLoginState();
    const loginUserId = loginUserInfo?.userId;
    const excludeIds = useMemo(() => (loginUserId ? [loginUserId] : []), [loginUserId]);
    const { contacts, refreshContacts } = useResolvedContacts(NO_OCCUPIED_IDS, excludeIds);

    const fieldRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    /* Mirrors keep synchronous reads after writes, as Vue refs do. */
    const participantRef = useRef(participant);
    const attendeeMenuOpenRef = useRef(attendeeMenuOpen);
    const attendeeHitsRef = useRef(attendeeHits);
    const attendeeNamesRef = useRef(attendeeNames);
    const modelValueRef = useRef(modelValue);
    modelValueRef.current = modelValue;

    function setParticipantValue(value: string) {
      participantRef.current = value;
      setParticipant(value);
    }

    function setAttendeeMenuOpen(value: boolean) {
      attendeeMenuOpenRef.current = value;
      setAttendeeMenuOpenState(value);
    }

    function setAttendeeHits(value: AttendeeHit[]) {
      attendeeHitsRef.current = value;
      setAttendeeHitsState(value);
    }

    function setAttendeeNames(value: Map<string, string>) {
      attendeeNamesRef.current = value;
      setAttendeeNamesState(value);
    }

    function emitModelValue(value: string[]) {
      modelValueRef.current = value;
      onUpdateModelValue?.(value);
    }

    useImperativeHandle(ref, () => ({
      flushInput,
    }));

    const { host, zIndex } = useOverlay({
      lane: 'dropdown',
      open: attendeeMenuOpen,
      onClose: () => setAttendeeMenuOpen(false),
    }, [fieldRef, menuRef]);
    const { x, y } = useFloating({
      reference: fieldRef,
      floating: menuRef,
      placement: 'bottom-start',
      offset: 4,
      enabled: attendeeMenuOpen,
    });

    useEffect(() => {
      if (attendeeMenuOpen) {
        setMenuWidth(fieldRef.current?.offsetWidth ?? 0);
      }
    }, [attendeeMenuOpen]);

    const refreshContactsRef = useRef(refreshContacts);
    refreshContactsRef.current = refreshContacts;
    useEffect(() => {
      void refreshContactsRef.current();
    }, []);

    function onAttendeeInput(value: string = participantRef.current) {
      const query = value.trim();
      if (!query) {
        setAttendeeMenuOpen(false);
        setAttendeeHits([]);
        return;
      }
      setAttendeeMenuOpen(true);
      setAttendeeHits(attendeeSearchHits(query, modelValueRef.current, contacts));
    }

    function openContacts() {
      setAttendeeMenuOpen(false);
      setContactsOpen(true);
    }

    function attendeeLabel(userId: string): string {
      const contactName = contacts.find(item => item.userId === userId)?.userName ?? '';
      return attendeeChipLabel(userId, [
        attendeeNames.get(userId) ?? '',
        knownNames[userId] ?? '',
        contactName,
      ]);
    }

    function attendeeAvatar(userId: string): string {
      return contacts.find(item => item.userId === userId)?.avatarUrl ?? '';
    }

    function rememberAttendees(users: readonly PickedContact[]) {
      const next = new Map(attendeeNamesRef.current);
      for (const user of users) {
        const name = user.userName.trim();
        next.set(user.userId, name || user.userId);
      }
      setAttendeeNames(next);
    }

    function applyContacts(users: PickedContact[]) {
      const ids = uniqueParticipantIds(users.map(user => user.userId));
      const kept = new Set(ids);
      setAttendeeNames(new Map());
      rememberAttendees(users.filter(user => kept.has(user.userId)));
      emitModelValue(ids);
      setContactsOpen(false);
    }

    function pickAttendee(userId: string) {
      const hit = attendeeHitsRef.current.find(item => item.userId === userId);
      if (hit) {
        rememberAttendees([{ userId, userName: hit.displayName }]);
      }
      commitAttendee(userId);
    }

    function removeParticipant(userId: string) {
      const next = new Map(attendeeNamesRef.current);
      next.delete(userId);
      setAttendeeNames(next);
      emitModelValue(modelValueRef.current.filter(item => item !== userId));
    }

    function resolveContactId(userId: string): string | undefined {
      if (contacts.some(item => item.userId === userId)) {
        return userId;
      }
      if (attendeeHitsRef.current.length === 1) {
        return attendeeHitsRef.current[0].userId;
      }
      return undefined;
    }

    function commitAttendee(userId: string) {
      if (!modelValueRef.current.includes(userId)) {
        emitModelValue([...modelValueRef.current, userId]);
      }
      setParticipantValue('');
      setAttendeeMenuOpen(false);
      setAttendeeHits([]);
    }

    function onEnter() {
      const userId = participantRef.current.trim();
      if (!userId) {
        setAttendeeMenuOpen(false);
        return;
      }
      const contactId = resolveContactId(userId);
      if (!contactId) {
        setAttendeeMenuOpen(true);
        setAttendeeHits([]);
        return;
      }
      commitAttendee(contactId);
    }

    function flushInput(): boolean {
      const userId = participantRef.current.trim();
      if (!userId) {
        setAttendeeMenuOpen(false);
        return true;
      }
      const contactId = resolveContactId(userId);
      if (contactId) {
        commitAttendee(contactId);
        return true;
      }
      /* Unmatched search leftover is not a pending attendee. */
      setParticipantValue('');
      setAttendeeMenuOpen(false);
      setAttendeeHits([]);
      return true;
    }

    return (
      <>
        <div className="sch-field is-attendee">
          <label
            className="sch-label"
            htmlFor={participantId}
          >
            {t('Schedule.Participants')}
          </label>
          <div className="sch-attendee">
            <div ref={fieldRef} className="sch-attendee-field">
              <TUIInput
                id={participantId}
                modelValue={participant}
                className="sch-participant-input"
                type="text"
                clearable
                {...{ autoComplete: 'off' }}
                placeholder={t('Schedule.ParticipantsPlaceholder')}
                aria-label={t('Schedule.ParticipantsLabel')}
                onUpdateModelValue={value => setParticipantValue(String(value ?? ''))}
                onInput={value => onAttendeeInput(String(value ?? ''))}
                onFocus={() => onAttendeeInput()}
                onEnter={onEnter}
                suffixSlot={(
                  <TUIButton
                    className="sch-attendee-add"
                    variant="ghost"
                    size="sm"
                    title={t('Schedule.PickContacts')}
                    aria-label={t('Schedule.PickContacts')}
                    onClick={openContacts}
                  >
                    <IconUserPlus size={16} />
                  </TUIButton>
                )}
              />
            </div>
            {host && attendeeMenuOpen && createPortal(
              <div
                ref={menuRef}
                className="rk-float sch-attendee-menu"
                style={{ left: `${x}px`, top: `${y}px`, zIndex, width: `${menuWidth}px` }}
              >
                {!attendeeHits.length
                  ? (
                    <div className="sch-attendee-empty">
                      {t('Schedule.AttendeeEmpty')}
                    </div>
                  )
                  : (
                    attendeeHits.map(hit => (
                      <div
                        key={hit.userId}
                        className="sch-attendee-hit"
                        onClick={() => pickAttendee(hit.userId)}
                      >
                        <TUIAvatar
                          className="sch-attendee-hit-av"
                          size={15}
                          src={hit.avatarUrl}
                          alt={hit.displayName}
                        />
                        <span className="sch-attendee-hit-name">{hit.displayName}</span>
                      </div>
                    ))
                  )}
              </div>,
              host,
            )}
            {modelValue.length > 0 && (
              <div className="sch-attendee-chips">
                {modelValue.map(userId => (
                  <span
                    key={userId}
                    className="sch-attendee-chip"
                  >
                    <TUIAvatar
                      className="sch-attendee-chip-av"
                      size={20}
                      src={attendeeAvatar(userId)}
                      alt={attendeeLabel(userId)}
                    />
                    <span className="sch-attendee-chip-name">{attendeeLabel(userId)}</span>
                    <TUIButton
                      className="sch-attendee-chip-x"
                      variant="ghost"
                      size="sm"
                      aria-label={t('Schedule.RemoveParticipant', { userId: attendeeLabel(userId) })}
                      onClick={() => removeParticipant(userId)}
                    >
                      <IconClose size={10} />
                    </TUIButton>
                  </span>
                ))}
                <span className="sch-attendee-count">{t('Schedule.AttendeeCount', { count: modelValue.length })}</span>
              </div>
            )}
          </div>
        </div>
        <UserPickerPC
          open={contactsOpen}
          onUpdateOpen={setContactsOpen}
          selectedIds={modelValue}
          onConfirm={applyContacts}
        />
      </>
    );
  },
);

ScheduleAttendeeField.displayName = 'ScheduleAttendeeField';

export default ScheduleAttendeeField;
