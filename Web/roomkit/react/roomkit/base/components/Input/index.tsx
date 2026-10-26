import { useEffect, useRef, useState } from 'react';
import type {
  ChangeEvent,
  CompositionEvent,
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
} from 'react';
import { IconClear, IconEye, IconEyeOff } from '../../icons';
import { useComposition } from './useComposition';
import './index.scss';

type FieldElement = HTMLInputElement | HTMLTextAreaElement;

export interface TUIInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onInput' | 'onFocus' | 'onBlur' | 'placeholder' | 'autoFocus' | 'defaultValue'
> {
  modelValue?: string | number | null;
  type?: 'text' | 'password' | 'number' | 'textarea';
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  showPassword?: boolean;
  maxlength?: number;
  rows?: number;
  size?: 'sm' | 'md' | 'lg';
  status?: 'default' | 'error';
  textAlign?: 'left' | 'center';
  autoFocus?: boolean;
  onUpdateModelValue?: (value: string | number | null) => void;
  onInput?: (value: string | number | null) => void;
  onChange?: (value: string | number | null) => void;
  onFocus?: (e: FocusEvent<FieldElement>) => void;
  onBlur?: (e: FocusEvent<FieldElement>) => void;
  onEnter?: (e: KeyboardEvent<FieldElement>) => void;
  prefixSlot?: ReactNode;
  suffixSlot?: ReactNode;
}

export function TUIInput(props: TUIInputProps) {
  const {
    modelValue = '',
    type = 'text',
    placeholder,
    disabled = false,
    clearable = false,
    showPassword = false,
    maxlength,
    rows = 3,
    size = 'md',
    status = 'default',
    textAlign = 'left',
    autoFocus = false,
    onUpdateModelValue,
    onInput: emitInput,
    onChange: emitChange,
    onFocus: emitFocus,
    onBlur: emitBlur,
    onEnter: emitEnter,
    prefixSlot,
    suffixSlot,
    className,
    ...rest
  } = props;

  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  // Controlled fields are re-synced to `value` after every change; keep the IME text while composing.
  const [composingValue, setComposingValue] = useState<string | null>(null);
  const inputRef = useRef<FieldElement | null>(null);
  const { composing, onCompositionStart, onCompositionEnd } = useComposition();
  const isTextarea = type === 'textarea';
  const isNumberType = type === 'number';
  const inputType = type === 'password' ? (visible ? 'text' : 'password') : type;

  let displayValue: string;
  if (isNumberType && focused) displayValue = draft;
  else if (modelValue == null) displayValue = '';
  else displayValue = String(modelValue);

  function exceedsMaxLength(value: string) {
    return maxlength != null && value.length > maxlength;
  }

  function emitValue(value: string | number | null) {
    onUpdateModelValue?.(value);
    emitInput?.(value);
  }

  function parseNumberInput(el: HTMLInputElement): number | null | undefined {
    if (el.value === '') return null;
    if (Number.isFinite(el.valueAsNumber)) return el.valueAsNumber;
    return undefined;
  }

  function commit(value: string) {
    if (isNumberType && exceedsMaxLength(value)) return;
    if (!isNumberType) {
      emitValue(value);
      return;
    }
    setDraft(value);
    if (value === '') {
      emitValue(null);
      return;
    }
    const n = Number(value);
    if (Number.isFinite(n)) emitValue(n);
  }

  function clear() {
    setDraft('');
    emitValue(isNumberType ? null : '');
  }

  function onInput(event: ChangeEvent<FieldElement>) {
    const el = event.target;
    if (composing.current) {
      setComposingValue(el.value);
      return;
    }
    if (isNumberType && exceedsMaxLength(el.value)) {
      el.value = draft;
      return;
    }
    if (!isNumberType) {
      emitValue(el.value);
      return;
    }
    setDraft(el.value);
    const parsed = parseNumberInput(el as HTMLInputElement);
    if (parsed !== undefined) emitValue(parsed);
  }

  function onChange(event: Event) {
    const el = event.target as FieldElement;
    if (!isNumberType) {
      emitChange?.(el.value);
      return;
    }
    const parsed = parseNumberInput(el as HTMLInputElement);
    if (parsed !== undefined) emitChange?.(parsed);
  }

  function onFocus(event: FocusEvent<FieldElement>) {
    setFocused(true);
    if (isNumberType) {
      setDraft(modelValue == null ? '' : String(modelValue));
    }
    emitFocus?.(event);
  }

  function onBlur(event: FocusEvent<FieldElement>) {
    setFocused(false);
    if (isNumberType) {
      const parsed = parseNumberInput(event.target as HTMLInputElement);
      if (parsed === undefined) {
        setDraft(modelValue == null ? '' : String(modelValue));
      } else if (parsed !== modelValue) {
        emitValue(parsed);
      }
    }
    emitBlur?.(event);
  }

  function onKeyDown(event: KeyboardEvent<FieldElement>) {
    if (event.key !== 'Enter') return;
    if (composing.current) return;
    emitEnter?.(event);
  }

  function onCompositionEndField(event: CompositionEvent<FieldElement>) {
    setComposingValue(null);
    onCompositionEnd(event, commit);
  }

  // React has no native `change` event (its onChange fires per keystroke), so bind it directly.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const listener = (event: Event) => onChangeRef.current(event);
    el.addEventListener('change', listener);
    return () => el.removeEventListener('change', listener);
  }, [isTextarea]);

  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [autoFocus]);

  const fieldValue = composingValue ?? displayValue;

  return (
    <div
      {...rest}
      className={[
        'rk-input',
        `rk-input-${size}`,
        `rk-input-${status}`,
        `rk-input-align-${textAlign}`,
        disabled ? 'rk-input-disabled' : '',
        isTextarea ? 'rk-input-textarea' : '',
        type === 'password' && !isTextarea ? 'rk-input-password' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
    >
      {prefixSlot != null && !isTextarea && (
        <span className="rk-input-addon">
          {prefixSlot}
        </span>
      )}
      {isTextarea
        ? (
          <textarea
            ref={(el) => {
              inputRef.current = el;
            }}
            className="rk-input-field"
            value={fieldValue}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxlength}
            rows={rows}
            onChange={onInput}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEndField}
          />
        )
        : (
          <input
            ref={(el) => {
              inputRef.current = el;
            }}
            className="rk-input-field"
            type={inputType}
            value={fieldValue}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxlength}
            onChange={onInput}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEndField}
          />
        )}
      {clearable && !disabled && String(modelValue ?? '') && (
        <button
          className="rk-input-action"
          type="button"
          onClick={clear}
        >
          <IconClear />
        </button>
      )}
      {showPassword && type === 'password' && !isTextarea && (
        <button
          className="rk-input-action rk-input-password-toggle"
          type="button"
          onClick={() => setVisible(!visible)}
        >
          {visible ? <IconEye /> : <IconEyeOff />}
        </button>
      )}
      {suffixSlot != null && !isTextarea && (
        <span className="rk-input-addon">
          {suffixSlot}
        </span>
      )}
    </div>
  );
}

export default TUIInput;
