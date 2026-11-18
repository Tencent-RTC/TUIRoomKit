import './index.scss';

export interface TUISegmentedOption {
  value: string;
  label: string;
}

export interface TUISegmentedProps {
  modelValue: string;
  options: TUISegmentedOption[];
  size?: 'sm' | 'md';
  onUpdateModelValue?: (value: string) => void;
}

export function TUISegmented({ modelValue, options, size = 'md', onUpdateModelValue }: TUISegmentedProps) {
  function select(value: string) {
    if (value !== modelValue) onUpdateModelValue?.(value);
  }

  return (
    <div className={`rk-segmented rk-segmented-${size}`} role="tablist">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="tab"
          className={['rk-segmented-item', option.value === modelValue ? 'is-active' : ''].filter(Boolean).join(' ')}
          aria-selected={option.value === modelValue}
          onClick={() => select(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default TUISegmented;
