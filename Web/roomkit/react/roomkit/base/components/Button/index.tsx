import { getPlatform } from '@tencentcloud/universal-api';
import type { ButtonHTMLAttributes, ComponentType, MouseEvent, ReactNode } from 'react';
import { IconLoading } from '../../icons';
import './index.scss';

export interface TUIButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick' | 'disabled'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  nativeType?: 'button' | 'submit' | 'reset';
  icon?: ComponentType;
  iconPosition?: 'start' | 'end';
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  loadingSlot?: ReactNode;
  iconSlot?: ReactNode;
}

export function TUIButton(props: TUIButtonProps) {
  const {
    variant = 'secondary',
    size = 'md',
    disabled = false,
    loading = false,
    block = false,
    nativeType = 'button',
    icon: Icon,
    iconPosition = 'start',
    onClick,
    children,
    loadingSlot,
    iconSlot,
    className,
    ...rest
  } = props;

  const hasIcon = Icon != null || iconSlot != null;
  const iconNode = iconSlot ?? (Icon ? <Icon /> : null);
  const isH5Primary = variant === 'primary' && getPlatform() !== 'pc';

  return (
    <button
      {...rest}
      className={[
        'rk-btn',
        `rk-btn-${variant}`,
        `rk-btn-${size}`,
        block ? 'rk-btn-block' : '',
        loading ? 'rk-btn-loading' : '',
        isH5Primary ? 'is-h5' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      type={nativeType}
      onClick={e => onClick?.(e)}
    >
      {loading
        ? (
          <span className="rk-btn-loading">
            {loadingSlot ?? <IconLoading spin />}
          </span>
        )
        : iconPosition === 'start' && hasIcon
          ? (
            <span className="rk-btn-icon">
              {iconNode}
            </span>
          )
          : null}
      <span className="rk-btn-text">
        {children}
      </span>
      {!loading && iconPosition === 'end' && hasIcon && (
        <span className="rk-btn-icon">
          {iconNode}
        </span>
      )}
    </button>
  );
}

export default TUIButton;
