import type { ButtonHTMLAttributes } from 'react';
import { IconLoading } from '../../icons';
import './index.scss';

export interface TUISwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'disabled' | 'type'> {
  modelValue?: boolean;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onUpdateModelValue?: (value: boolean) => void;
  onChange?: (value: boolean) => void;
}

export function TUISwitch(props: TUISwitchProps) {
  const {
    modelValue = false,
    disabled = false,
    loading = false,
    size = 'md',
    onUpdateModelValue,
    onChange,
    className,
    ...rest
  } = props;

  function toggle() {
    if (disabled || loading) return;
    const next = !modelValue;
    onUpdateModelValue?.(next);
    onChange?.(next);
  }

  return (
    <button
      {...rest}
      className={[
        'rk-switch',
        `rk-switch-${size}`,
        modelValue ? 'rk-switch-on' : '',
        loading ? 'rk-switch-loading' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      type="button"
      role="switch"
      aria-checked={modelValue}
      disabled={disabled || loading}
      onClick={toggle}
    >
      <span className="rk-switch-thumb">
        {loading && <IconLoading spin />}
      </span>
    </button>
  );
}

export default TUISwitch;
