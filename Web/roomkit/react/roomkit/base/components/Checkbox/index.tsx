import type { LabelHTMLAttributes, ReactNode } from 'react';
import './index.scss';

export interface TUICheckboxProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  modelValue?: boolean;
  disabled?: boolean;
  onUpdateModelValue?: (value: boolean) => void;
  onChange?: (value: boolean) => void;
  children?: ReactNode;
}

export function TUICheckbox(props: TUICheckboxProps) {
  const {
    modelValue = false,
    disabled = false,
    onUpdateModelValue,
    onChange,
    className,
    children,
    ...rest
  } = props;

  function toggle() {
    if (disabled) return;
    const next = !modelValue;
    onUpdateModelValue?.(next);
    onChange?.(next);
  }

  return (
    <label
      {...rest}
      className={[
        'rk-checkbox',
        modelValue ? 'is-checked' : '',
        disabled ? 'is-disabled' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
    >
      <input
        className="rk-checkbox-input"
        type="checkbox"
        checked={modelValue}
        disabled={disabled}
        onChange={toggle}
      />
      <span
        className="rk-checkbox-box"
        aria-hidden="true"
      />
      {children != null && (
        <span className="rk-checkbox-label">
          {children}
        </span>
      )}
    </label>
  );
}

export default TUICheckbox;
