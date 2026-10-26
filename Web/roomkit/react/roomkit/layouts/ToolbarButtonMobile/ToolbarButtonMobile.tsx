import type { HTMLAttributes, ReactNode } from 'react';
import './ToolbarButtonMobile.scss';

export interface ToolbarButtonMobileProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Accessible name; the more sheet also prints it under the circle. */
  label: string;
  active?: boolean;
  /** Reported as `aria-pressed`; toggles that open a panel set it, plain actions leave it out. */
  pressed?: boolean;
  /** Looks unavailable but still emits click, so the handler can explain why */
  blocked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  badgeSlot?: ReactNode;
}

export function ToolbarButtonMobile(props: ToolbarButtonMobileProps) {
  const {
    label,
    active = false,
    pressed = undefined,
    blocked = false,
    disabled = false,
    onClick,
    children,
    badgeSlot,
    className,
    ...attrs
  } = props;

  function handleClick() {
    if (disabled) {
      return;
    }
    onClick?.();
  }

  return (
    <div
      className={[
        'toolbar-button-mobile',
        active ? 'is-active' : '',
        blocked ? 'is-blocked' : '',
        disabled ? 'is-disabled' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key !== 'Enter') {
          return;
        }
        event.preventDefault();
        handleClick();
      }}
      {...attrs}
    >
      <span className="toolbar-button-mobile-icon">
        {children}
      </span>
      {badgeSlot}
    </div>
  );
}

export default ToolbarButtonMobile;
