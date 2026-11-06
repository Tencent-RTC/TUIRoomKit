export type ClassRole = 'teacher' | 'student';

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
}
