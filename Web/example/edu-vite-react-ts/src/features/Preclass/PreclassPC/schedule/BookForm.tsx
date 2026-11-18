import { useEffect, useRef, useState } from 'react';
import { IconCalendar, TUIButton, TUICheckbox, TUIDatePicker, TUIInput, TUIOption, TUISelect, TUIToast, useI18n } from '@tencentcloud/roomkit-web-react';
import type { PickedContact } from '@tencentcloud/roomkit-web-react';
import MemberField from './MemberField';
import type { MemberFieldHandle } from './MemberField';
import { DEFAULT_DURATION, DURATIONS, TIMEZONES, clockOptions, durationLabel, formatDate, formatMonth, fromEpochSeconds, localTimezone, nextSlot, normalizeDuration, timezoneLabel, toEpochSeconds, weekdayLabels } from './scheduleTime';
import { CLASS_MODES } from '../../classMode';
import type { ClassMode } from '../../classMode';
import type { ClassCourse } from '../../types';
import type { BookInput } from './useClassSchedule';

const CLOCKS = clockOptions();
interface BookFormProps {
  course?: ClassCourse;
  attendees?: PickedContact[];
  defaultTitle: string;
  submitting: boolean;
  onSubmit: (input: BookInput) => void;
  onCancel: () => void;
}

export default function BookForm({ course, attendees, defaultTitle, submitting, onSubmit, onCancel }: BookFormProps) {
  const { t } = useI18n();
  const [initialZone] = useState(localTimezone);
  const [initialSlot] = useState(() => course ? fromEpochSeconds(course.start, initialZone) : nextSlot(Date.now(), initialZone));
  const [title, setTitle] = useState(course?.title ?? defaultTitle);
  const [dateKey, setDateKey] = useState(initialSlot.dateKey);
  const [clock, setClock] = useState(initialSlot.clock);
  const [duration, setDuration] = useState(course ? normalizeDuration((course.end - course.start) / 60) : DEFAULT_DURATION);
  const [timezone, setTimezone] = useState<string>(initialZone);
  const [members, setMembers] = useState<PickedContact[]>(attendees ?? []);
  const hasEditedMembers = useRef(false);
  const hasLoadedMembers = !course || attendees !== undefined;
  const [muteAll, setMuteAll] = useState(course?.muteAll ?? false);
  const [classMode, setClassMode] = useState<ClassMode>(course?.classMode ?? 'oneOnOne');
  const membersField = useRef<MemberFieldHandle>(null);
  useEffect(() => {
    if (attendees && !hasEditedMembers.current) setMembers(attendees);
  }, [attendees]);

  function selectMode(mode: ClassMode) {
    const { isAvailable, maxMembers } = CLASS_MODES[mode];
    if (!isAvailable) {
      TUIToast.info(t('Preclass.ComingSoon'));
      return;
    }
    if (maxMembers !== undefined && members.length > maxMembers) {
      TUIToast.warning(t(mode === 'small' ? 'Preclass.SmallMember' : 'Preclass.OneMember'));
      return;
    }
    setClassMode(mode);
  }
  function submit() {
    const name = title.trim();
    if (!name || submitting || !hasLoadedMembers) return;
    const { maxMembers } = CLASS_MODES[classMode];
    if (maxMembers !== undefined && members.length > maxMembers) {
      membersField.current?.showMemberLimit();
      return;
    }
    const start = toEpochSeconds(dateKey, clock, timezone);
    if (start * 1000 <= Date.now()) {
      TUIToast.warning(t('Preclass.StartInPast'));
      return;
    }
    onSubmit({ title: name, start, end: start + (duration || DEFAULT_DURATION) * 60, attendees: members, muteAll, classMode });
  }

  return (
    <form
      className="preclass-book"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="preclass-book-body">
        <label className="preclass-field">
          <span className="preclass-field-label">{t('Preclass.RoomName')}</span>
          <TUIInput modelValue={title} onUpdateModelValue={value => setTitle(String(value ?? ''))} className="preclass-book-input" type="text" maxlength={25} placeholder={t('Preclass.RoomNamePlaceholder')} />
        </label>
        <div className="preclass-field">
          <span className="preclass-field-label">{t('Preclass.Start')}</span>
          <div className="preclass-book-time">
            <TUIDatePicker modelValue={dateKey} onUpdateModelValue={setDateKey} disablePast weekdays={weekdayLabels()} prevMonthLabel={t('Schedule.PrevMonth')} nextMonthLabel={t('Schedule.NextMonth')} formatMonth={formatMonth}>
              {({ open }) => (
                <span className={`preclass-book-date ${open ? 'is-open' : ''}`}>
                  <IconCalendar size={14} />
                  <span className="preclass-book-date-text">{formatDate(dateKey)}</span>
                </span>
              )}
            </TUIDatePicker>
            <TUISelect modelValue={clock} onUpdateModelValue={value => setClock(String(value))} className="preclass-book-select">{CLOCKS.map(slot => <TUIOption key={slot} value={slot} />)}</TUISelect>
          </div>
        </div>
        <div className="preclass-field">
          <span className="preclass-field-label">{t('Preclass.Duration')}</span>
          <TUISelect modelValue={duration} onUpdateModelValue={value => setDuration(Number(value))} className="preclass-book-select">{DURATIONS.map(minutes => <TUIOption key={minutes} value={minutes} label={durationLabel(minutes)} />)}</TUISelect>
        </div>
        <div className="preclass-field">
          <span className="preclass-field-label">{t('Preclass.Timezone')}</span>
          <TUISelect modelValue={timezone} onUpdateModelValue={value => setTimezone(String(value))} className="preclass-book-select">{TIMEZONES.map(zone => <TUIOption key={zone} value={zone} label={timezoneLabel(zone)} />)}</TUISelect>
        </div>
        <div className="preclass-field">
          <span className="preclass-field-label">{t('Preclass.ClassMode')}</span>
          <div className="preclass-book-mode">
            {(Object.keys(CLASS_MODES) as ClassMode[]).map(mode => <button key={mode} type="button" className={`preclass-book-mode-item ${mode === classMode ? 'is-active' : ''}`} disabled={!!course} onClick={() => selectMode(mode)}>{t(CLASS_MODES[mode].label)}</button>)}
          </div>
          {CLASS_MODES[classMode].hint && <span className="preclass-book-mode-hint">{t(CLASS_MODES[classMode].hint!)}</span>}
        </div>
        <div className="preclass-field is-top">
          <span className="preclass-field-label">{t('Preclass.Members')}</span>
          <MemberField
            ref={membersField}
            modelValue={members}
            onUpdateModelValue={(users) => {
              hasEditedMembers.current = true;
              setMembers(users);
            }}
            maxCount={CLASS_MODES[classMode].maxMembers}
          />
        </div>
        {classMode !== 'oneOnOne' && (
          <div className="preclass-field">
            <span className="preclass-field-label">{t('Preclass.MemberPolicy')}</span>
            <TUICheckbox modelValue={muteAll} onUpdateModelValue={setMuteAll} disabled={!!course}>{t('Preclass.MuteAll')}</TUICheckbox>
          </div>
        )}
      </div>
      <footer className="preclass-book-foot">
        <TUIButton className="preclass-book-button" variant="secondary" onClick={onCancel}>{t('Preclass.Cancel')}</TUIButton>
        <TUIButton className="preclass-book-button" variant="primary" nativeType="submit" disabled={!title.trim() || !hasLoadedMembers} loading={submitting}>{t(course ? 'Preclass.Save' : 'Preclass.ConfirmBook')}</TUIButton>
      </footer>
    </form>
  );
}
