import type { InjectionKey } from 'vue';

export type SwiperDirection = 'horizontal' | 'vertical';
export type SwiperChangeSource = 'touch' | 'nav' | 'autoplay';

export interface SwiperContext {
  reportClick: (el: HTMLElement) => void;
  wasDragged: () => boolean;
}

export const swiperKey: InjectionKey<SwiperContext> = Symbol('rk-swiper');
