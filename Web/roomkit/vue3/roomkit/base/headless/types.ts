import type { Ref } from 'vue';
import type { OverlayLane, Placement } from '../tokens';

export type MaybeRef<T> = T | Ref<T>;

export interface UseOverlayOptions {
  lane: OverlayLane;
  open: Ref<boolean>;
  closeOnOutside?: boolean;
  closeOnEsc?: boolean;
  modal?: boolean;
  /** The overlay's anchor, used to keep picture-in-picture popovers in their window. */
  reference?: Ref<HTMLElement | null | undefined>;
  onClose?: () => void;
}

export interface UseFloatingOptions {
  reference: Ref<HTMLElement | null>;
  floating: Ref<HTMLElement | null>;
  placement?: MaybeRef<Placement | undefined>;
  offset?: MaybeRef<number | undefined>;
  flip?: boolean;
  shift?: boolean;
  /** Report a `maxHeight`. Only for panels that apply it — positioning assumes they do. */
  constrainHeight?: boolean;
  arrow?: Ref<HTMLElement | null>;
  boundary?: Readonly<Ref<HTMLElement | null>>;
  enabled?: Ref<boolean>;
}
