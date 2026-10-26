import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFloating } from '../../headless/useFloating';
import { useOverlay } from '../../headless/useOverlay';
import { useRovingFocus } from '../../headless/useRovingFocus';
import { IconChevron, IconClear } from '../../icons';
import { SELECT_CONTEXT_KEY } from '../../tokens';
import type { SelectContext, SelectOptionRecord } from '../../tokens';
import { collectSelectOptions } from './collectOptions';
import './Select.scss';

export interface TUISelectProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'placeholder'> {
  modelValue?: string | number | null;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  emptyText?: string;
  onUpdateModelValue?: (value: string | number | null) => void;
  onChange?: (value: string | number | null) => void;
  children?: ReactNode;
  prefixSlot?: ReactNode;
  emptySlot?: ReactNode;
}

export function TUISelect(props: TUISelectProps) {
  const {
    modelValue: modelValueProp,
    placeholder = 'Select',
    disabled = false,
    clearable = false,
    size = 'md',
    emptyText = 'No data',
    onUpdateModelValue,
    onChange,
    children,
    prefixSlot,
    emptySlot,
    className,
    ...rest
  } = props;

  const referenceRef = useRef<HTMLDivElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptionsState] = useState<SelectOptionRecord[]>([]);
  // Options register from their own effects; the open handler reads them before re-render.
  const optionsRef = useRef<SelectOptionRecord[]>([]);
  const setOptions = useCallback((next: SelectOptionRecord[]) => {
    optionsRef.current = next;
    setOptionsState(next);
  }, []);
  const [triggerWidth, setTriggerWidth] = useState(0);
  const modelValue = modelValueProp ?? null;
  const slotOptions = useMemo(() => collectSelectOptions(children), [children]);
  const { highlighted, setHighlighted, onKeydown } = useRovingFocus(options);

  let selectedLabel = options.find(item => item.value === modelValue)?.label || '';
  if (!selectedLabel) {
    selectedLabel = slotOptions.find(item => item.value === modelValue)?.label || '';
  }

  const { host, zIndex } = useOverlay({
    lane: 'dropdown',
    open: isOpen,
    closeOnOutside: true,
    closeOnEsc: true,
    onClose: () => {
      setIsOpen(false);
    },
  }, [referenceRef, floatingRef]);

  const { x, y, update } = useFloating({
    reference: referenceRef,
    floating: floatingRef,
    placement: 'bottom-start',
    offset: 6,
    enabled: isOpen,
  });

  // Context callbacks read the latest emitters through this ref.
  const emitRef = useRef({ onUpdateModelValue, onChange });
  emitRef.current = { onUpdateModelValue, onChange };

  const setValue = useCallback((value: string | number | null) => {
    emitRef.current.onUpdateModelValue?.(value);
    emitRef.current.onChange?.(value);
  }, []);

  const ctxValue = useMemo<SelectContext>(() => ({
    modelValue,
    register: (option) => {
      const next = optionsRef.current.filter(item => item.value !== option.value);
      next.push(option);
      setOptions(next);
    },
    unregister: (value) => {
      setOptions(optionsRef.current.filter(item => item.value !== value));
    },
    select: (value) => {
      setValue(value);
      setIsOpen(false);
    },
    highlighted,
  }), [modelValue, highlighted, setOptions, setValue]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    // The panel matches the trigger exactly, so a long option cannot widen it; options
    // ellipsize the way the trigger's own value does.
    setTriggerWidth(referenceRef.current?.offsetWidth ?? 0);
    update();
    setHighlighted(modelValue ?? optionsRef.current.find(item => !item.disabled)?.value ?? null);
  }, [isOpen]);

  function toggle() {
    if (disabled) return;
    setIsOpen(!isOpen);
  }

  function clear() {
    setValue(null);
    referenceRef.current?.focus();
  }

  function selectHighlighted() {
    const current = options.find(item => item.value === highlighted && !item.disabled);
    if (!current) return;
    setValue(current.value);
    setIsOpen(false);
    referenceRef.current?.blur();
  }

  function onTriggerKeydown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      onKeydown(event);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isOpen) selectHighlighted();
      return;
    }

    if ((event.key === 'Backspace' || event.key === 'Delete') && clearable && modelValue != null) {
      event.preventDefault();
      clear();
      return;
    }

    if (!isOpen) return;
    if (event.key === 'Home' || event.key === 'End' || event.key.length === 1) {
      onKeydown(event);
    }
  }

  return (
    <SELECT_CONTEXT_KEY.Provider value={ctxValue}>
      <div
        {...rest}
        className={[
          'rk-select',
          `rk-select-${size}`,
          disabled ? 'rk-select-disabled' : '',
          isOpen ? 'rk-select-open' : '',
          className ?? '',
        ].filter(Boolean).join(' ')}
      >
        <div
          ref={referenceRef}
          className="rk-select-trigger"
          role="combobox"
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-disabled={disabled}
          onClick={toggle}
          onKeyDown={onTriggerKeydown}
        >
          {prefixSlot != null && (
            <span className="rk-select-prefix">
              {prefixSlot}
            </span>
          )}
          <span className={['rk-select-value', !selectedLabel ? 'is-placeholder' : ''].filter(Boolean).join(' ')}>
            {selectedLabel || placeholder}
          </span>
          {clearable && modelValue != null && !disabled && (
            <button
              className="rk-select-clear"
              type="button"
              tabIndex={-1}
              aria-label="Clear"
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                clear();
              }}
            >
              <IconClear />
            </button>
          )}
          <IconChevron className="rk-select-chevron" />
        </div>
        {host && isOpen && createPortal(
          <div
            ref={floatingRef}
            className="rk-float rk-select-panel"
            role="listbox"
            style={{ left: `${x}px`, top: `${y}px`, zIndex, width: `${triggerWidth}px` }}
            onKeyDown={onKeydown}
          >
            {children}
            {!slotOptions.length && (
              <div className="rk-select-empty">
                {emptySlot ?? emptyText}
              </div>
            )}
          </div>,
          host,
        )}
      </div>
    </SELECT_CONTEXT_KEY.Provider>
  );
}

export default TUISelect;
