import { computed } from 'vue';
import type { Ref } from 'vue';
import { useElementWidth } from '../../../base';

/** Container width tiers that drive conference chrome density. */
export type ConferenceSize = 'wide' | 'medium' | 'thin';

/** Below this, the side panel floats and the topbar sheds secondary controls. */
const THIN_BREAKPOINT = 700;
/** Below this (and at/above thin), the side panel floats over the stage. */
const MEDIUM_BREAKPOINT = 1100;

export function getConferenceSize(width: number): ConferenceSize {
  if (width < THIN_BREAKPOINT) return 'thin';
  if (width < MEDIUM_BREAKPOINT) return 'medium';
  return 'wide';
}

export function useConferenceSize(root: Ref<HTMLElement | null>) {
  const { width } = useElementWidth(root);

  return { size: computed(() => getConferenceSize(width.value)) };
}
