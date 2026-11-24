import type { RoomInfo } from 'tuikit-atomicx-vue3/room';

export type ClassMode = 'oneOnOne' | 'small' | 'large';

interface ClassModeConfig {
  label: string;
  hint?: string;
  /** Students one booking may invite; unset means no limit. */
  maxMembers?: number;
  /** Unavailable modes only say "coming soon". */
  isAvailable: boolean;
}

/** Every class-mode difference lives here; key order is the display order. */
export const CLASS_MODES: Record<ClassMode, ClassModeConfig> = {
  oneOnOne: {
    label: 'Preclass.ClassModeOneOnOne',
    hint: 'Preclass.ClassModeOneOnOneDesc',
    maxMembers: 1,
    isAvailable: true,
  },
  small: {
    label: 'Preclass.ClassModeSmall',
    hint: 'Preclass.ClassModeSmallDesc',
    maxMembers: 6,
    isAvailable: true,
  },
  large: {
    label: 'Preclass.ClassModeLarge',
    isAvailable: false,
  },
};

/** The room id prefix is the only class-mode marker; ids without a known prefix (legacy or hand-entered) default to the 1v1 flow. */
export function getClassMode(room: RoomInfo): ClassMode {
  if (room.roomId?.startsWith('edu_small_')) {
    return 'small';
  }
  return 'oneOnOne';
}
