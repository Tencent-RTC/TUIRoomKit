import { useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  DeviceStatus,
  NetworkQuality,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import { useParticipantAutoLoad } from '../../features/Participants/participantData';
import { useParticipantMetaData } from '../../features/Participants/participantMetaData';
import { useShareParticipants } from '../../features/Whiteboard/WhiteboardState';
import { readTrophyCount } from '../../features/EduTools/Trophy/trophyActions';

/**
 * Classroom state lives on participant metaData and only the teacher writes it: class-wide
 * keys on the teacher, per-student keys on that student. atomicx has no room-level metadata,
 * and the engine caps each member's metaData at 60 characters.
 */
export const SWAP_KEY = 'edu.swap';
/** On the student: the teacher allows this student to draw on the board. */
export const BOARD_AUTH_KEY = 'edu.boardAuth';

export interface ClassMeta {
  /** The teacher's camera holds the main area and the board sits in the side seat. */
  swapped: boolean;
}

export function emptyClassMeta(): ClassMeta {
  return { swapped: false };
}

export function readBoardAuth(metaData?: Record<string, string>): boolean {
  return metaData?.[BOARD_AUTH_KEY] === '1';
}

export function parseClassMeta(metaData?: Record<string, string>): ClassMeta {
  return { swapped: metaData?.[SWAP_KEY] === '1' };
}

/** The engine may replace the whole map on write, so every write carries all existing keys. */
export function patchMetaData(
  metaData: Record<string, string> | undefined,
  patch: Record<string, string>,
): Record<string, string> {
  return { ...(metaData ?? {}), ...patch };
}

export type SeatRole = 'teacher' | 'student';
export type StageMain = 'board' | 'teacher';

/** Classroom layout modes; the room id pattern decides which one a class runs. */
export enum ClassMode {
  /** One teacher and one student in the two-seat layout. */
  OneToOne = 'onetoone',
  /** One teacher and up to six students from the same list. */
  Small = 'small',
}

const SMALL_CLASS_STUDENT_LIMIT = 6;

/** `edu_small_*` is a small (1v6) class. Every other room id, including `edu_1v1_*`, stays onetoone. */
export function parseClassMode(roomId?: string): ClassMode {
  return roomId?.startsWith('edu_small_') ? ClassMode.Small : ClassMode.OneToOne;
}

/** Portrait small classes retain all six student seats. */
export function padStudentSeats(tiles: TileData[]): TileData[] {
  const missing = SMALL_CLASS_STUDENT_LIMIT - tiles.length;
  return missing <= 0
    ? tiles
    : [
      ...tiles,
      ...Array.from({ length: missing }, () => toTileData('student', undefined, NetworkQuality.Unknown)),
    ];
}

/** Everything a classroom tile renders; an empty seat has no participant. */
export interface TileData {
  seat: SeatRole;
  participant?: RoomParticipant;
  name: string;
  avatarUrl: string;
  micOn: boolean;
  cameraOn: boolean;
  weakNetwork: boolean;
  /** Trophy count on the student's own metaData; `trophyActions` owns the key and the award flow. */
  trophyCount: number;
  boardAuthorized: boolean;
}

export interface StageModel {
  /** What fills the main area; the other one sits in the teacher seat. */
  main: StageMain;
  /** A whiteboard or screen share is up. */
  hasBoard: boolean;
  canSwap: boolean;
}

export function deriveMain(swapped: boolean, hasTeacher: boolean, hasBoard: boolean): StageMain {
  return swapped && hasTeacher && hasBoard ? 'teacher' : 'board';
}

export function toTileData(
  seat: SeatRole,
  participant: RoomParticipant | undefined,
  quality: number,
): TileData {
  const name = participant ? (participant.nameCard || participant.userName || participant.userId) : '';
  const isStudent = seat === 'student';
  return {
    seat,
    participant,
    name,
    avatarUrl: participant?.avatarUrl ?? '',
    micOn: participant?.microphoneStatus === DeviceStatus.On,
    cameraOn: participant?.cameraStatus === DeviceStatus.On,
    weakNetwork: !!participant && quality >= NetworkQuality.Poor,
    trophyCount: isStudent && participant ? readTrophyCount(participant) : 0,
    boardAuthorized: isStudent && readBoardAuth(participant?.metaData),
  };
}

interface ClassroomSnapshot {
  /** Sticky: once seated, the student keeps the seat while still in the room. */
  studentId: string;
  meta: ClassMeta;
  /** The local user's board authorization changed after the first read. */
  authNotice: { on: boolean; seq: number } | null;
}

/**
 * Shared by every caller, the way Vue keeps one detached copy: tiles, actions and the view
 * read the same seats and swap state whichever component asks first.
 */
let classroomState: ClassroomSnapshot = {
  studentId: '',
  meta: emptyClassMeta(),
  authNotice: null,
};
const listeners = new Set<() => void>();

function patchClassroom(next: Partial<ClassroomSnapshot>): void {
  classroomState = { ...classroomState, ...next };
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ClassroomSnapshot {
  return classroomState;
}

// Every caller runs the same effects, so edges are detected once against these module copies.
let lastRoomId: string | undefined;
let lastSelfBoardAuthorized: boolean | undefined;
let noticeSeq = 0;

/**
 * The 1v1 classroom has three fixed seats: the owner is the teacher, the first other
 * member is the student, and the stage carries whatever is being shared. Anyone else
 * in the room gets no seat.
 */
export function useClassroom() {
  // The participant list stays empty until something loads it.
  useParticipantAutoLoad();

  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const { networkQualities } = useRoomParticipantState();
  const readMetaData = useParticipantMetaData();
  const { localParticipant, participantList, participantWithScreen: sharer } = useShareParticipants();
  const { studentId, meta, authNotice } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const roomId = currentRoom?.roomId;

  /** The local entry carries live device state, so it wins over the list copy. */
  const members = useMemo(() => {
    const others = participantList.filter(item => item.userId !== localParticipant?.userId);
    return localParticipant ? [localParticipant, ...others] : others;
  }, [localParticipant, participantList]);

  const teacherId = currentRoom?.roomOwner?.userId ?? '';
  const teacher = members.find(item => item.userId === teacherId);
  const classMode = parseClassMode(roomId);
  const student = members.find(item => item.userId === studentId);
  const students = useMemo(() => {
    if (classMode === ClassMode.OneToOne) {
      return student ? [student] : [];
    }
    const roster = participantList.map(item => (
      localParticipant && item.userId === localParticipant.userId ? localParticipant : item
    ));
    if (localParticipant && !roster.some(item => item.userId === localParticipant.userId)) {
      roster.push(localParticipant);
    }
    return roster.filter(item => item.userId !== teacherId).slice(0, SMALL_CLASS_STUDENT_LIMIT);
  }, [classMode, student, participantList, localParticipant, teacherId]);

  useEffect(() => {
    if (roomId === lastRoomId) {
      return;
    }
    lastRoomId = roomId;
    patchClassroom({ meta: emptyClassMeta(), authNotice: null });
  }, [roomId]);

  useEffect(() => {
    if (!teacherId) {
      return;
    }
    const current = classroomState.studentId;
    const seated = members.some(item => item.userId === current && item.userId !== teacherId);
    const next = seated ? current : members.find(item => item.userId !== teacherId)?.userId ?? '';
    if (next !== current) {
      patchClassroom({ studentId: next });
    }
  }, [members, teacherId]);

  // Kept while the teacher is away, so the swap does not blink out on a drop.
  const teacherSwapped = teacher ? parseClassMeta(readMetaData(teacher)).swapped : undefined;
  useEffect(() => {
    if (teacherSwapped !== undefined && teacherSwapped !== classroomState.meta.swapped) {
      patchClassroom({ meta: { swapped: teacherSwapped } });
    }
  }, [teacherSwapped]);

  /** Undefined until the local entry loads, so the state found on entry raises no notice. */
  const selfBoardAuthorized = localParticipant ? readBoardAuth(readMetaData(localParticipant)) : undefined;
  useEffect(() => {
    const previous = lastSelfBoardAuthorized;
    if (selfBoardAuthorized === previous) {
      return;
    }
    lastSelfBoardAuthorized = selfBoardAuthorized;
    if (selfBoardAuthorized !== undefined && previous !== undefined) {
      noticeSeq += 1;
      patchClassroom({ authNotice: { on: selfBoardAuthorized, seq: noticeSeq } });
    }
  }, [selfBoardAuthorized]);

  const isTeacher = !!teacherId && teacherId === loginUserInfo?.userId;

  function qualityOf(participant?: RoomParticipant): number {
    if (!participant) {
      return NetworkQuality.Unknown;
    }
    return networkQualities.get(participant.userId)?.quality ?? NetworkQuality.Unknown;
  }

  const hasBoard = !!sharer;
  const hasTeacher = !!teacher;
  const stage: StageModel = {
    main: deriveMain(meta.swapped, hasTeacher, hasBoard),
    hasBoard,
    canSwap: isTeacher && hasTeacher && hasBoard,
  };

  const studentTiles = students.map((item) => {
    const metaData = readMetaData(item);
    const participant = metaData === item.metaData ? item : { ...item, metaData };
    return toTileData('student', participant, qualityOf(item));
  });
  if (classMode === ClassMode.OneToOne && studentTiles.length === 0) {
    studentTiles.push(toTileData('student', undefined, NetworkQuality.Unknown));
  }

  return {
    isTeacher,
    teacher,
    students,
    student,
    studentTiles,
    classMode,
    sharer,
    meta,
    authNotice,
    selfBoardAuthorized: !!selfBoardAuthorized,
    stage,
    teacherTile: toTileData('teacher', teacher, qualityOf(teacher)),
    studentTile: toTileData('student', student, qualityOf(student)),
  };
}
