import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { IconChevron } from '../../icons';
import { TUIButton } from '../Button';
import { TUIPopover } from '../Popover';
import { calendarCells, canShiftMonth, isDateInRange, toDateKey } from './calendar';
import './index.scss';

const DEFAULT_WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface TUIDatePickerProps {
  /** `YYYY-MM-DD` in local time. */
  modelValue: string;
  min?: string;
  max?: string;
  /** Raises `min` to the current day, re-read every time the panel opens. */
  disablePast?: boolean;
  disabled?: boolean;
  /** Seven labels, Sunday first. */
  weekdays?: string[];
  prevMonthLabel?: string;
  nextMonthLabel?: string;
  formatMonth?: (year: number, month: number) => string;
  onUpdateModelValue?: (value: string) => void;
  onChange?: (value: string) => void;
  /** Anchor content; a function receives the panel open state. */
  children?: ReactNode | ((scope: { open: boolean }) => ReactNode);
}

export function TUIDatePicker(props: TUIDatePickerProps) {
  const {
    modelValue,
    min,
    max,
    disablePast = false,
    disabled = false,
    weekdays = DEFAULT_WEEKDAYS,
    prevMonthLabel = 'Previous month',
    nextMonthLabel = 'Next month',
    formatMonth,
    onUpdateModelValue,
    onChange,
    children,
  } = props;

  const [isOpen, setOpen] = useState(false);
  const [today, setToday] = useState(() => toDateKey(new Date()));
  const [view, setView] = useState({ year: 0, month: 0 });

  /** Raises `min` to the given day when `disablePast` is set. */
  function resolveMinDate(todayKey: string): string | undefined {
    if (!disablePast) return min;
    return min && min > todayKey ? min : todayKey;
  }

  const minDate = resolveMinDate(today);
  const cells = calendarCells(view.year, view.month);
  const canPrevMonth = canShiftMonth(view.year, view.month, -1, minDate, max);
  const canNextMonth = canShiftMonth(view.year, view.month, 1, minDate, max);
  const monthTitle = formatMonth
    ? formatMonth(view.year, view.month)
    : new Date(view.year, view.month - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });

  function isSelectable(iso: string): boolean {
    return isDateInRange(iso, minDate, max);
  }

  /** Shows the selected month, or the first selectable one when the value is out of range. */
  function syncView(todayKey: string = today) {
    const effectiveMin = resolveMinDate(todayKey);
    const anchor = modelValue && isDateInRange(modelValue, effectiveMin, max)
      ? modelValue
      : effectiveMin ?? todayKey;
    const [year, month] = anchor.split('-').map(Number);
    setView({ year, month });
  }

  useEffect(() => {
    syncView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelValue]);

  function setOpenState(open: boolean) {
    setOpen(open);
    if (open) {
      const nextToday = toDateKey(new Date());
      setToday(nextToday);
      syncView(nextToday);
    }
  }

  function shiftMonth(offset: number) {
    if (!canShiftMonth(view.year, view.month, offset, minDate, max)) return;
    const cursor = new Date(view.year, view.month - 1 + offset, 1);
    setView({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
  }

  function pick(iso: string) {
    if (!isSelectable(iso)) return;
    onUpdateModelValue?.(iso);
    onChange?.(iso);
    setOpen(false);
  }

  const anchor = typeof children === 'function' ? children({ open: isOpen }) : children;

  return (
    <div className="rk-date-picker">
      <TUIPopover
        open={isOpen}
        placement="bottom-start"
        offset={4}
        padded={false}
        disabled={disabled}
        onUpdateOpen={setOpenState}
        contentSlot={(
          <div className="rk-date-picker-panel">
            <div className="rk-date-picker-head">
              <TUIButton
                className="rk-date-picker-nav"
                variant="ghost"
                size="sm"
                aria-label={prevMonthLabel}
                disabled={!canPrevMonth}
                onClick={() => shiftMonth(-1)}
              >
                <IconChevron
                  className="rk-date-picker-prev"
                  size={14}
                />
              </TUIButton>
              <div className="rk-date-picker-title">
                {monthTitle}
              </div>
              <TUIButton
                className="rk-date-picker-nav"
                variant="ghost"
                size="sm"
                aria-label={nextMonthLabel}
                disabled={!canNextMonth}
                onClick={() => shiftMonth(1)}
              >
                <IconChevron
                  className="rk-date-picker-next"
                  size={14}
                />
              </TUIButton>
            </div>
            <div className="rk-date-picker-week">
              {weekdays.map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>
            <div className="rk-date-picker-grid">
              {cells.map(cell => (
                <div
                  key={cell.iso}
                  className={[
                    'rk-date-picker-day',
                    cell.muted ? 'is-muted' : '',
                    !isSelectable(cell.iso) ? 'is-disabled' : '',
                    cell.iso === today ? 'is-today' : '',
                    cell.iso === modelValue ? 'is-active' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => pick(cell.iso)}
                >
                  {cell.day}
                </div>
              ))}
            </div>
          </div>
        )}
      >
        {anchor}
      </TUIPopover>
    </div>
  );
}

export default TUIDatePicker;
