import type { HTMLAttributes, ReactNode } from 'react';
import './index.scss';

export interface TUIBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  value?: string | number;
  max?: number;
  dot?: boolean;
  hidden?: boolean;
  variant?: 'danger' | 'info' | 'success';
  children?: ReactNode;
}

export function TUIBadge(props: TUIBadgeProps) {
  const {
    value,
    max = 99,
    dot = false,
    hidden = false,
    variant = 'danger',
    children,
    className,
    ...rest
  } = props;

  let displayValue = '';
  if (value != null && value !== '') {
    displayValue = typeof value === 'number' && value > max ? `${max}+` : String(value);
  }

  return (
    <span
      {...rest}
      className={['rk-badge', children == null ? 'rk-badge-standalone' : '', className ?? ''].filter(Boolean).join(' ')}
    >
      {children}
      {!hidden && (dot || displayValue) && (
        <sup
          className={['rk-badge-mark', `rk-badge-mark-${variant}`, dot ? 'rk-badge-mark-dot' : ''].filter(Boolean).join(' ')}
        >
          {!dot && displayValue}
        </sup>
      )}
    </span>
  );
}

export default TUIBadge;
