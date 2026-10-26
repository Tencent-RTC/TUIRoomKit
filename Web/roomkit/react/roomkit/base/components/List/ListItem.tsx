import type { CSSProperties, ReactNode } from 'react';
import './ListItem.scss';

export interface ListItemProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function TUIListItem({ children, className, style }: ListItemProps) {
  return (
    <div
      className={['rk-list-item', className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </div>
  );
}

export default TUIListItem;
