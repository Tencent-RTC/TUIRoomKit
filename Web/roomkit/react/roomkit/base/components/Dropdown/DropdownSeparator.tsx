import type { HTMLAttributes } from 'react';
import './DropdownSeparator.scss';

export type TUIDropdownSeparatorProps = HTMLAttributes<HTMLDivElement>;

export function TUIDropdownSeparator(props: TUIDropdownSeparatorProps) {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      className={['rk-dropdown-separator', className ?? ''].filter(Boolean).join(' ')}
      role="separator"
    />
  );
}

export default TUIDropdownSeparator;
