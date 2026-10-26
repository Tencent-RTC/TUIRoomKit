import { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { IconCheck } from '../../icons';
import { SELECT_CONTEXT_KEY } from '../../tokens';
import type { SelectOptionRecord } from '../../tokens';
import './Option.scss';

export interface TUIOptionProps extends HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function TUIOption(props: TUIOptionProps) {
  const { value, label, disabled = false, children, className, ...rest } = props;

  const ctx = useContext(SELECT_CONTEXT_KEY);
  const elRef = useRef<HTMLDivElement | null>(null);
  const labelText = label ?? String(value);
  const selected = ctx?.modelValue === value;
  const highlighted = ctx?.highlighted === value;

  function readLabel() {
    return label || elRef.current?.textContent?.trim() || String(value);
  }

  /* Re-sync after every commit, since the label may come from rendered children;
     only register when something actually changed so registering cannot loop. */
  const registeredRef = useRef<SelectOptionRecord | null>(null);
  useLayoutEffect(() => {
    const next: SelectOptionRecord = {
      value,
      label: readLabel(),
      disabled: !!disabled,
      el: elRef.current,
    };
    const prev = registeredRef.current;
    if (prev
      && prev.value === next.value
      && prev.label === next.label
      && prev.disabled === next.disabled
      && prev.el === next.el) {
      return;
    }
    if (prev && prev.value !== next.value) ctx?.unregister(prev.value);
    registeredRef.current = next;
    ctx?.register(next);
  });

  const isFirstRunRef = useRef(true);
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    if (highlighted) elRef.current?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const latestRef = useRef({ ctx, value });
  latestRef.current = { ctx, value };
  useEffect(() => () => {
    latestRef.current.ctx?.unregister(latestRef.current.value);
  }, []);

  function onClick() {
    if (disabled) return;
    ctx?.select(value);
  }

  return (
    <div
      {...rest}
      ref={elRef}
      className={['rk-option', className ?? ''].filter(Boolean).join(' ')}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      data-highlighted={highlighted}
      onClick={onClick}
    >
      {/* The panel is as wide as the trigger, so a long label is cut; the title keeps
          the full text reachable. Slot content has no title: it may not be plain text. */}
      <span className="rk-option-label" title={label}>
        {children ?? labelText}
      </span>
      {selected && <IconCheck />}
    </div>
  );
}

export default TUIOption;
