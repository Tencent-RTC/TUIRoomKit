import type { CSSProperties, HTMLAttributes, MouseEvent, ReactNode } from 'react';

export interface TUIIconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color' | 'onClick'> {
  size?: number | string;
  color?: string;
  spin?: boolean;
  onClick?: (e: MouseEvent<HTMLSpanElement>) => void;
  children?: ReactNode;
}

export function TUIIcon(props: TUIIconProps) {
  const { size, color, spin = false, onClick, children, className, style, ...rest } = props;

  let cssSize: string | undefined;
  if (size != null) {
    cssSize = typeof size === 'number' ? `${size}px` : size;
  }
  const iconStyle: CSSProperties = {
    width: cssSize,
    height: cssSize,
    color,
  };

  return (
    <span
      {...rest}
      className={['rk-icon', spin ? 'rk-icon-spin' : '', className ?? ''].filter(Boolean).join(' ')}
      style={{ ...iconStyle, ...style }}
      onClick={e => onClick?.(e)}
    >
      {children}
    </span>
  );
}

export default TUIIcon;
