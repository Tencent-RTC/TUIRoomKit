import { useContext, useEffect, useRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { DROPDOWN_CONTEXT_KEY } from '../../tokens';
import './DropdownItem.scss';

export interface TUIDropdownItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'type'> {
  command?: string | number;
  disabled?: boolean;
  danger?: boolean;
  children?: ReactNode;
}

let itemSeed = 0;

export function TUIDropdownItem(props: TUIDropdownItemProps) {
  const { command, disabled = false, danger = false, children, className, ...rest } = props;

  const ctx = useContext(DROPDOWN_CONTEXT_KEY);
  const elRef = useRef<HTMLButtonElement | null>(null);
  const fallbackId = `item-${++itemSeed}`;
  const value = command ?? fallbackId;
  const highlighted = ctx?.highlighted === value;

  const latestRef = useRef({ ctx, value, disabled });
  latestRef.current = { ctx, value, disabled };

  useEffect(() => {
    const latest = latestRef.current;
    latest.ctx?.register({ value: latest.value, disabled: latest.disabled, el: elRef.current });
    return () => {
      latestRef.current.ctx?.unregister(latestRef.current.value);
    };
  }, []);

  function onEnter() {
    if (disabled || !ctx) return;
    ctx.setHighlighted(value);
  }

  function onClick() {
    if (disabled) return;
    ctx?.onCommand(value);
  }

  return (
    <button
      {...rest}
      ref={elRef}
      className={['rk-dropdown-item', className ?? ''].filter(Boolean).join(' ')}
      type="button"
      disabled={disabled}
      data-highlighted={highlighted}
      data-danger={danger}
      onMouseEnter={onEnter}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default TUIDropdownItem;
