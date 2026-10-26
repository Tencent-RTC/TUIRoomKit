import type { RefObject } from 'react';
import type { OverlayLane, Placement } from '../tokens';

export type ElementRef<T extends HTMLElement = HTMLElement> = RefObject<T | null>;

export interface UseOverlayOptions {
  lane: OverlayLane;
  open: boolean;
  closeOnOutside?: boolean;
  closeOnEsc?: boolean;
  modal?: boolean;
  onClose?: () => void;
  /** Anchor element; an anchor inside another window keeps the overlay in that window. */
  reference?: ElementRef;
}

export interface UseFloatingOptions {
  reference: ElementRef;
  floating: ElementRef;
  placement?: Placement;
  offset?: number;
  flip?: boolean;
  shift?: boolean;
  /** Report a `maxHeight`. Only for panels that apply it — positioning assumes they do. */
  constrainHeight?: boolean;
  arrow?: ElementRef;
  boundary?: ElementRef;
  enabled?: boolean;
}
