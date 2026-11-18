import { computed, effectScope, ref, watch } from 'vue';
import {
  DeviceStatus,
  NetworkQuality,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';
import { useParticipantAutoLoad } from '../../features/Participants/participantData';
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

/** A small class shows this many students from list order. 1v1 keeps one seated student instead. */
const SMALL_CLASS_STUDENT_LIMIT = 6;

/** `edu_small_*` is a small (1v6) class. Every other room id, including `edu_1v1_*`, stays onetoone. */
export function parseClassMode(roomId?: string): ClassMode {
  return roomId?.startsWith('edu_small_') ? ClassMode.Small : ClassMode.OneToOne;
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

/** Portrait H5 small class fills every seat. PC and landscape show only who has joined. */
export function padStudentSeats(tiles: TileData[]): TileData[] {
  const missing = SMALL_CLASS_STUDENT_LIMIT - tiles.length;
  if (missing <= 0) return tiles;
  return [
    ...tiles,
    ...Array.from({ length: missing }, () => toTileData('student', undefined, NetworkQuality.Unknown)),
  ];
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

/**
 * The room owner is the teacher. Everyone else is a student. A 1v1 class keeps the
 * seated student until they leave. A small class shows the first six in list order.
 */
function useClassSeats() {
  // The participant list stays empty until something loads it.
  useParticipantAutoLoad();

  const { currentRoom } = useRoomState();
  const { localParticipant, participantList, participantWithScreen } = useRoomParticipantState();

  /** The local entry carries live device state, so it wins over the list copy. */
  const members = computed(() => {
    const local = localParticipant.value;
    const others = participantList.value.filter(item => item.userId !== local?.userId);
    return local ? [local, ...others] : others;
  });

  const teacherId = computed(() => currentRoom.value?.roomOwner?.userId ?? '');
  const teacher = computed(() => members.value.find(item => item.userId === teacherId.value));

  // 1v1: once seated, the student keeps the seat while still in the room.
  const studentId = ref('');
  watch([members, teacherId], ([list, ownerId]) => {
    if (!ownerId) {
      return;
    }
    const seated = list.some(item => item.userId === studentId.value && item.userId !== ownerId);
    if (!seated) {
      studentId.value = list.find(item => item.userId !== ownerId)?.userId ?? '';
    }
  }, { immediate: true });

  // Small class: the local record replaces the list copy so this client's own mic and camera stay live.
  const students = computed(() => {
    if (parseClassMode(currentRoom.value?.roomId) === ClassMode.OneToOne) {
      const seated = members.value.find(item => item.userId === studentId.value);
      return seated ? [seated] : [];
    }
    const local = localParticipant.value;
    const list = participantList.value.map(item => (
      local && item.userId === local.userId ? local : item
    ));
    const roster = local && !list.some(item => item.userId === local.userId)
      ? [...list, local]
      : list;
    return roster
      .filter(item => item.userId !== teacherId.value)
      .slice(0, SMALL_CLASS_STUDENT_LIMIT);
  });

  return {
    teacher,
    students,
    sharer: participantWithScreen,
  };
}

function createClassroom() {
  const { currentRoom } = useRoomState();
  const { localParticipant, networkQualities } = useRoomParticipantState();
  const { loginUserInfo } = useLoginState();
  const { teacher, students, sharer } = useClassSeats();

  const meta = ref<ClassMeta>(emptyClassMeta());
  /** The local user's board authorization changed after the first read. */
  const authNotice = ref<{ on: boolean; seq: number } | null>(null);
  let seq = 0;

  watch(() => currentRoom.value?.roomId, () => {
    meta.value = emptyClassMeta();
    authNotice.value = null;
  });

  // Kept while the teacher is away, so the swap does not blink out on a drop.
  watch(() => teacher.value?.metaData, (metaData) => {
    if (!teacher.value) {
      return;
    }
    meta.value = parseClassMeta(metaData);
  }, { immediate: true, deep: true });

  /** Undefined until the local entry loads, so the state found on entry raises no notice. */
  const selfBoardAuthorized = computed(() => (
    localParticipant.value ? readBoardAuth(localParticipant.value.metaData) : undefined
  ));
  watch(selfBoardAuthorized, (on, previous) => {
    if (on !== undefined && previous !== undefined && on !== previous) {
      seq += 1;
      authNotice.value = { on, seq };
    }
  });

  const isTeacher = computed(() => {
    const ownerId = currentRoom.value?.roomOwner?.userId;
    return !!ownerId && ownerId === loginUserInfo.value?.userId;
  });

  function qualityOf(participant?: RoomParticipant): number {
    if (!participant) {
      return NetworkQuality.Unknown;
    }
    return networkQualities.value.get(participant.userId)?.quality ?? NetworkQuality.Unknown;
  }

  const stage = computed<StageModel>(() => {
    const hasBoard = !!sharer.value;
    const hasTeacher = !!teacher.value;
    return {
      main: deriveMain(meta.value.swapped, hasTeacher, hasBoard),
      hasBoard,
      canSwap: isTeacher.value && hasTeacher && hasBoard,
    };
  });

  const classMode = computed(() => parseClassMode(currentRoom.value?.roomId));
  const teacherTile = computed(() => toTileData('teacher', teacher.value, qualityOf(teacher.value)));
  const studentTiles = computed(() => {
    const tiles = students.value.map(item => toTileData('student', item, qualityOf(item)));
    // 1v1 keeps its one seat visible while the student has not joined.
    if (classMode.value === ClassMode.OneToOne && tiles.length === 0) {
      return [toTileData('student', undefined, NetworkQuality.Unknown)];
    }
    return tiles;
  });

  return {
    isTeacher,
    teacher,
    students,
    sharer,
    meta,
    authNotice,
    selfBoardAuthorized: computed(() => !!selfBoardAuthorized.value),
    stage,
    teacherTile,
    studentTiles,
    classMode,
  };
}

let classroom: ReturnType<typeof createClassroom> | null = null;

/** Detached, so tiles and actions share one copy whichever component asks first. */
export function useClassroom() {
  classroom ??= effectScope(true).run(createClassroom)!;
  return classroom;
}
