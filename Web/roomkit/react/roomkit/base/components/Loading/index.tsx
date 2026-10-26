import type { HTMLAttributes, ReactNode } from 'react';
import { IconLoading } from '../../icons';
import './index.scss';

export interface TUILoadingProps extends HTMLAttributes<HTMLDivElement> {
  spinning?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tip?: string;
  variant?: 'default' | 'card';
  children?: ReactNode;
  iconSlot?: ReactNode;
  tipSlot?: ReactNode;
}

export function TUILoading(props: TUILoadingProps) {
  const {
    spinning = true,
    size = 'md',
    tip,
    variant = 'default',
    children,
    iconSlot,
    tipSlot,
    className,
    ...rest
  } = props;

  const hasContent = children != null;
  const showIndicator = spinning;
  const iconSize = {
    sm: 16,
    md: 24,
    lg: 36,
  }[size];

  return (
    <div
      {...rest}
      className={[
        'rk-loading',
        `rk-loading-${size}`,
        `rk-loading-${variant}`,
        hasContent ? 'rk-loading-wrap' : '',
        showIndicator ? 'rk-loading-spinning' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
    >
      {hasContent && (
        <div className="rk-loading-content">
          {children}
        </div>
      )}
      {showIndicator && (
        <div
          className="rk-loading-indicator"
          role="status"
          aria-label={tip || '加载中'}
        >
          <div className="rk-loading-panel">
            {iconSlot ?? (variant === 'card'
              ? <span className="rk-loading-ring" />
              : <IconLoading spin size={iconSize} />)}
            {(tip || tipSlot != null) && (
              <span className="rk-loading-tip">
                {tipSlot ?? tip}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TUILoading;
