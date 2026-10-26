import { useContext, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { swiperKey } from './types';
import './SwiperItem.scss';

export interface SwiperItemProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function TUISwiperItem({ children, className, style }: SwiperItemProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ctx = useContext(swiperKey);

  function onClick() {
    if (ctx?.wasDragged()) return;
    if (rootRef.current) ctx?.reportClick(rootRef.current);
  }

  return (
    <div
      ref={rootRef}
      className={['rk-swiper-item', className].filter(Boolean).join(' ')}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default TUISwiperItem;
