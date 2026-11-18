import type { RoomInfo } from 'tuikit-atomicx-react/room';

export type ClassMode = 'oneOnOne' | 'small' | 'large';

interface ClassModeConfig {
  label: string;
  hint?: string;
  maxMembers?: number;
  isAvailable: boolean;
}

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

/** Legacy room ids follow the one-on-one flow. */
export function getClassMode(room: RoomInfo): ClassMode {
  return room.roomId?.startsWith('edu_small_') ? 'small' : 'oneOnOne';
}
