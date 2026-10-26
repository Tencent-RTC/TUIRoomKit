import { createContext } from 'react';

export type SwiperDirection = 'horizontal' | 'vertical';
export type SwiperChangeSource = 'touch' | 'nav' | 'autoplay';

export interface SwiperContext {
  reportClick: (el: HTMLElement) => void;
  wasDragged: () => boolean;
}

export const swiperKey = createContext<SwiperContext | null>(null);
