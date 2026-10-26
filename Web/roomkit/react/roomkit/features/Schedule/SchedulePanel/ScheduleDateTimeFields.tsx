import { TUIDatePicker, IconCalendar, TUIOption, TUISelect } from '../../../base';
import { useI18n } from '../../../i18n';
import {
  DURATION_MINUTES,
  TIMEZONE_VALUES,
  WEEKDAY_SHORT_KEYS,
  durationLabel,
  formatScheduleDate,
  formatScheduleMonth,
  timeSlots,
  timezoneLabel,
} from './scheduleUtils';
import './ScheduleDateTimeFields.scss';

export interface ScheduleDateTimeFieldsProps {
  date: string;
  time: string;
  duration: number;
  timezone: string;
  onUpdateDate?: (value: string) => void;
  onUpdateTime?: (value: string) => void;
  onUpdateDuration?: (value: number) => void;
  onUpdateTimezone?: (value: string) => void;
}

export function ScheduleDateTimeFields(props: ScheduleDateTimeFieldsProps) {
  const {
    date,
    time,
    duration,
    timezone,
    onUpdateDate,
    onUpdateTime,
    onUpdateDuration,
    onUpdateTimezone,
  } = props;
  const { t } = useI18n();

  const slots = timeSlots();
  const weekdays = WEEKDAY_SHORT_KEYS.map(key => t(key));

  return (
    <>
      <div className="sch-field is-datetime">
        <span className="sch-label">{t('Schedule.Start')}</span>
        <div className="sch-time-row">
          <TUIDatePicker
            modelValue={date}
            disablePast
            weekdays={weekdays}
            prevMonthLabel={t('Schedule.PrevMonth')}
            nextMonthLabel={t('Schedule.NextMonth')}
            formatMonth={formatScheduleMonth}
            onChange={value => onUpdateDate?.(value)}
          >
            {({ open }) => (
              <div className={['sch-time-card', open ? 'is-open' : ''].filter(Boolean).join(' ')}>
                <span className="sch-time-icon">
                  <IconCalendar size={14} />
                </span>
                <span className="sch-time-value-text">{formatScheduleDate(date)}</span>
              </div>
            )}
          </TUIDatePicker>
          <TUISelect
            className="sch-select"
            modelValue={time}
            onChange={value => onUpdateTime?.(String(value))}
          >
            {slots.map(slot => (
              <TUIOption key={slot} value={slot} />
            ))}
          </TUISelect>
        </div>
      </div>

      <div className="sch-field is-datetime">
        <span className="sch-label">{t('Schedule.Duration')}</span>
        <TUISelect
          className="sch-select"
          modelValue={duration}
          onChange={value => onUpdateDuration?.(Number(value))}
        >
          {DURATION_MINUTES.map(minutes => (
            <TUIOption
              key={minutes}
              value={minutes}
              label={durationLabel(minutes)}
            />
          ))}
        </TUISelect>
      </div>

      <div className="sch-field is-datetime">
        <span className="sch-label">{t('Schedule.Timezone')}</span>
        <TUISelect
          className="sch-select"
          modelValue={timezone}
          onChange={value => onUpdateTimezone?.(String(value))}
        >
          {TIMEZONE_VALUES.map(zone => (
            <TUIOption
              key={zone}
              value={zone}
              label={timezoneLabel(zone)}
            />
          ))}
        </TUISelect>
      </div>
    </>
  );
}

export default ScheduleDateTimeFields;
