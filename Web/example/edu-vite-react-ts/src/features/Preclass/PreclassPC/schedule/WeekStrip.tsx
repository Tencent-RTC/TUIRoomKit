import { useI18n } from '@tencentcloud/roomkit-web-react';
import { addDays, daysOfWeek, formatDayLabel, formatMonth, sameDay, toDateKey, weekStart, weekdayLabels } from './scheduleTime';

interface WeekStripProps {
  selected: Date;
  markedDays: Set<string>;
  now: number;
  onSelect: (day: Date) => void;
}

export default function WeekStrip({ selected, markedDays, now, onSelect }: WeekStripProps) {
  const { t } = useI18n();
  return (
    <div className="preclass-week">
      <div className="preclass-week-bar">
        <button type="button" className="preclass-week-nav" aria-label={t('Preclass.PrevWeek')} onClick={() => onSelect(addDays(selected, -7))}>‹</button>
        <span>{formatMonth(selected.getFullYear(), selected.getMonth() + 1)}</span>
        <button type="button" className="preclass-week-nav" aria-label={t('Preclass.NextWeek')} onClick={() => onSelect(addDays(selected, 7))}>›</button>
      </div>
      <div className="preclass-week-head" aria-hidden="true">{weekdayLabels().map((label, index) => <span key={index}>{label}</span>)}</div>
      <div className="preclass-week-days">
        {daysOfWeek(weekStart(selected)).map(day => (
          <button key={toDateKey(day)} type="button" className={`preclass-week-day ${sameDay(day, selected) ? 'is-on' : ''} ${sameDay(day, new Date(now)) ? 'is-today' : ''}`} aria-pressed={sameDay(day, selected)} aria-label={formatDayLabel(day)} onClick={() => onSelect(day)}>
            <b className="preclass-week-num">{day.getDate()}</b>
            <i className={`preclass-week-dot ${markedDays.has(toDateKey(day)) ? '' : 'is-empty'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
