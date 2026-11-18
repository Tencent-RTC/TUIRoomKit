import type { ClassMode } from './classMode';

export type ClassRole = 'teacher' | 'student';

export interface PreclassProps {
  className?: string;
  onJoin: (roomId: string) => void;
  onLogout: () => void;
}

export interface ClassCourse {
  roomId: string;
  title: string;
  /** Seconds. */
  start: number;
  /** Seconds. */
  end: number;
  teacherName: string;
  isMine: boolean;
  status: 'idle' | 'live';
  muteAll: boolean;
  classMode: ClassMode;
}
