import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { TUIButton, TUIDialog, TUIInput, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import type { ScheduledRoom } from '../ScheduledListPC/useSchedule';
import ScheduleShareDialog from '../ScheduledListPC/ScheduleShareDialog';
import ScheduleAttendeeField from './ScheduleAttendeeField';
import type { ScheduleAttendeeFieldExpose } from './ScheduleAttendeeField';
import ScheduleDateTimeFields from './ScheduleDateTimeFields';
import SchedulePolicyFields from './SchedulePolicyFields';
import {
  DEFAULT_DURATION,
  DURATION_MAX,
  DURATION_MIN,
  PASSWORD_LENGTH,
  TOPIC_MAX,
  isPasswordComplete,
  isSchedulePolicyLocked,
  isValidTopic,
} from './scheduleForm';
import type { ScheduleOutcome, ScheduleRoomInput } from './scheduleForm';
import {
  clampScheduleDate,
  dateKey,
  epochMsToWall,
  localTimezone,
  wallTimeToEpochMs,
} from './scheduleUtils';
import './SchedulePanel.scss';

export interface SchedulePanelProps {
  open: boolean;
  userName: string;
  meeting?: ScheduledRoom | null;
  schedule: (input: ScheduleRoomInput) => Promise<ScheduleOutcome>;
  className?: string;
  style?: CSSProperties;
  onUpdateOpen?: (open: boolean) => void;
  onScheduled?: (roomId: string, input: ScheduleRoomInput) => void;
}

export function SchedulePanel(props: SchedulePanelProps) {
  const {
    open,
    userName,
    meeting,
    className,
    style,
    onUpdateOpen,
  } = props;
  const { t } = useI18n();

  const topicId = `meeting-topic-${useId()}`;
  const attendeeField = useRef<ScheduleAttendeeFieldExpose>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState<number>(DEFAULT_DURATION);
  const [timezone, setTimezone] = useState<string>(() => localTimezone());
  const [submitting, setSubmittingState] = useState(false);
  const [participants, setParticipantsState] = useState<string[]>([]);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isAllMicrophoneDisabled, setIsAllMicrophoneDisabled] = useState(false);
  const [isAllCameraDisabled, setIsAllCameraDisabled] = useState(false);
  const editing = !!meeting?.roomId;
  const knownAttendeeNames: Record<string, string> = {};
  for (const user of meeting?.attendees ?? []) {
    knownAttendeeNames[user.userId] = user.userName;
  }
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMeeting, setShareMeeting] = useState<ScheduledRoom>();
  const startTime = wallTimeToEpochMs(date, time, timezone);

  /* Mirrors keep synchronous reads after writes, as Vue refs do. */
  const propsRef = useRef(props);
  propsRef.current = props;
  const submittingRef = useRef(submitting);
  const participantsRef = useRef(participants);

  function setSubmitting(value: boolean) {
    submittingRef.current = value;
    setSubmittingState(value);
  }

  function setParticipants(value: string[]) {
    participantsRef.current = value;
    setParticipantsState(value);
  }

  const openWatchedRef = useRef(false);
  useEffect(() => {
    if (!openWatchedRef.current) {
      openWatchedRef.current = true;
      return;
    }
    if (open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function resetForm() {
    const { meeting: current } = propsRef.current;
    const next = new Date(Math.ceil((Date.now() + 60000) / 1800000) * 1800000);
    const zone = localTimezone();
    setTimezone(zone);
    if (current) {
      const wall = epochMsToWall(current.scheduledStartTime * 1000, zone);
      setTitle(current.roomName);
      setDate(wall.date);
      setTime(wall.time);
      setDuration(Math.max(
        DURATION_MIN,
        Math.round((current.scheduledEndTime - current.scheduledStartTime) / 60),
      ));
      setParticipants(current.attendees.map(user => user.userId));
      setPasswordProtected(!!current.password);
      setPassword(current.password || '');
      setIsAllMicrophoneDisabled(!!current.isAllMicrophoneDisabled);
      setIsAllCameraDisabled(!!current.isAllCameraDisabled);
    } else {
      setDate(clampScheduleDate(dateKey(next)));
      setTime(`${String(next.getHours()).padStart(2, '0')}:${String(Math.floor(next.getMinutes() / 15) * 15).padStart(2, '0')}`);
      setTitle(t('Schedule.DefaultTopic', { name: propsRef.current.userName.trim() }));
      setDuration(DEFAULT_DURATION);
      setParticipants([]);
      setPasswordProtected(false);
      setPassword('');
      setIsAllMicrophoneDisabled(false);
      setIsAllCameraDisabled(false);
    }
    setPasswordVisible(false);
    setPasswordError(false);
  }

  async function submit() {
    if (submittingRef.current) {
      return;
    }
    if (!isValidTopic(title)) {
      TUIToast.error(t('Schedule.Error.Topic', { min: 1, max: TOPIC_MAX }));
      return;
    }
    if (!Number.isFinite(startTime) || startTime <= Date.now()) {
      TUIToast.error(t('Schedule.Error.StartTime'));
      return;
    }
    if (!Number.isInteger(duration) || duration < DURATION_MIN) {
      TUIToast.error(t('Schedule.Error.DurationMin'));
      return;
    }
    if (duration > DURATION_MAX) {
      TUIToast.error(t('Schedule.Error.DurationMax'));
      return;
    }
    if (attendeeField.current && !attendeeField.current.flushInput()) {
      return;
    }
    const policyLocked = isSchedulePolicyLocked(editing);
    if (!policyLocked && passwordProtected && !isPasswordComplete(password)) {
      setPasswordError(true);
      TUIToast.error(t('Schedule.Error.Password', { length: PASSWORD_LENGTH }));
      return;
    }
    const scheduledStartTime = Math.floor(startTime / 1000);
    const input: ScheduleRoomInput = {
      roomName: title.trim(),
      scheduledStartTime,
      scheduledEndTime: scheduledStartTime + duration * 60,
      scheduleAttendees: [...participantsRef.current],
      password: passwordProtected ? password : undefined,
      isAllMicrophoneDisabled,
      isAllCameraDisabled,
    };
    setSubmitting(true);
    try {
      const result = await propsRef.current.schedule(input);
      if ('failure' in result) {
        TUIToast.error(t(`Schedule.Failure.${result.failure}`));
        return;
      }
      const wasEditing = !!propsRef.current.meeting?.roomId;
      propsRef.current.onScheduled?.(result.roomId, input);
      propsRef.current.onUpdateOpen?.(false);
      if (wasEditing) {
        TUIToast.success(t('Schedule.Updated'));
      } else {
        setShareMeeting({
          roomId: result.roomId,
          roomName: input.roomName,
          scheduledStartTime: input.scheduledStartTime,
          scheduledEndTime: input.scheduledEndTime,
          ownerUserId: '',
          password: input.password,
          attendees: input.scheduleAttendees.map(userId => ({ userId, userName: '' })),
        });
        setShareOpen(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function submitButtonText(): string {
    if (submitting) {
      return t('Schedule.Submitting');
    }
    return editing ? t('Schedule.Save') : t('Schedule.Confirm');
  }

  return (
    <div
      className={['schedule-dialog', className ?? ''].filter(Boolean).join(' ')}
      style={style}
    >
      <TUIDialog
        open={open}
        title={editing ? t('Schedule.EditTitle') : t('Schedule.Title')}
        width="540px"
        confirmText=""
        cancelText=""
        closable={!submitting}
        closeOnOverlay={!submitting}
        closeOnEsc={!submitting}
        onUpdateOpen={value => onUpdateOpen?.(value)}
        footerSlot={(
          <div className="schedule-footer">
            <TUIButton
              className="footer-button"
              variant="secondary"
              disabled={submitting}
              onClick={() => onUpdateOpen?.(false)}
            >
              {t('Schedule.Cancel')}
            </TUIButton>
            <TUIButton
              className="footer-button is-primary"
              variant="primary"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitButtonText()}
            </TUIButton>
          </div>
        )}
      >
        <form
          className="schedule-body"
          onSubmit={onSubmit}
        >
          <fieldset
            className="schedule-fields"
            disabled={submitting}
          >
            <div className="sch-field is-topic">
              <label
                className="sch-label"
                htmlFor={topicId}
              >
                {t('Schedule.Topic')}
              </label>
              <TUIInput
                id={topicId}
                modelValue={title}
                className="sch-topic-card"
                placeholder={t('Schedule.TopicPlaceholder')}
                maxlength={TOPIC_MAX}
                onUpdateModelValue={value => setTitle(String(value ?? ''))}
              />
            </div>

            <ScheduleDateTimeFields
              date={date}
              onUpdateDate={setDate}
              time={time}
              onUpdateTime={setTime}
              duration={duration}
              onUpdateDuration={setDuration}
              timezone={timezone}
              onUpdateTimezone={setTimezone}
            />

            <ScheduleAttendeeField
              ref={attendeeField}
              modelValue={participants}
              onUpdateModelValue={setParticipants}
              knownNames={knownAttendeeNames}
            />

            {!isSchedulePolicyLocked(editing) && (
              <SchedulePolicyFields
                passwordProtected={passwordProtected}
                onUpdatePasswordProtected={setPasswordProtected}
                password={password}
                onUpdatePassword={setPassword}
                passwordVisible={passwordVisible}
                onUpdatePasswordVisible={setPasswordVisible}
                passwordError={passwordError}
                onUpdatePasswordError={setPasswordError}
                isAllMicrophoneDisabled={isAllMicrophoneDisabled}
                onUpdateIsAllMicrophoneDisabled={setIsAllMicrophoneDisabled}
                isAllCameraDisabled={isAllCameraDisabled}
                onUpdateIsAllCameraDisabled={setIsAllCameraDisabled}
              />
            )}
          </fieldset>
        </form>
      </TUIDialog>
      <ScheduleShareDialog
        open={shareOpen}
        onUpdateOpen={setShareOpen}
        meeting={shareMeeting}
        mode="success"
        hostName={userName}
      />
    </div>
  );
}

export default SchedulePanel;
