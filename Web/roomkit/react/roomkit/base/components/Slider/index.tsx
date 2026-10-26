import { useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { useSliderDrag } from './useSliderDrag';
import './index.scss';

export interface TUISliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  modelValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onUpdateModelValue?: (value: number) => void;
  onChange?: (value: number) => void;
}

export function TUISlider(props: TUISliderProps) {
  const {
    modelValue = 0,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    onUpdateModelValue,
    onChange,
    className,
    ...rest
  } = props;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const current = modelValue ?? 0;

  const { ratio, onPointerDown, onPointerMove, onPointerUp, onKeydown } = useSliderDrag(trackRef, {
    value: current,
    min,
    max,
    step,
    disabled,
    onInput: value => onUpdateModelValue?.(value),
    onChange: value => onChange?.(value),
  });

  return (
    <div
      {...rest}
      ref={trackRef}
      className={['rk-slider', disabled ? 'rk-slider-disabled' : '', className ?? ''].filter(Boolean).join(' ')}
      role="slider"
      tabIndex={0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={modelValue}
      aria-disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeydown}
    >
      <div className="rk-slider-rail" />
      <div className="rk-slider-fill" style={{ width: `${ratio * 100}%` }} />
      <div className="rk-slider-thumb" style={{ left: `${ratio * 100}%` }} />
    </div>
  );
}

export default TUISlider;
