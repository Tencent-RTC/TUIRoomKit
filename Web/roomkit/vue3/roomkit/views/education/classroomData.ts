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

/**
 * The 1v1 classroom has three fixed seats: the owner is the teacher, the first other
 * member is the student, and the stage carries whatever is being shared. Anyone else
 * in the room gets no seat.
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

  // Sticky: once seated, the student keeps the seat while still in the room.
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
  const student = computed(() => members.value.find(item => item.userId === studentId.value));

  return {
    teacher,
    student,
    sharer: participantWithScreen,
  };
}

function createClassroom() {
  const { currentRoom } = useRoomState();
  const { localParticipant, networkQualities } = useRoomParticipantState();
  const { loginUserInfo } = useLoginState();
  const { teacher, student, sharer } = useClassSeats();

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

  const teacherTile = computed(() => toTileData('teacher', teacher.value, qualityOf(teacher.value)));
  const studentTile = computed(() => toTileData('student', student.value, qualityOf(student.value)));

  return {
    isTeacher,
    teacher,
    student,
    sharer,
    meta,
    authNotice,
    selfBoardAuthorized: computed(() => !!selfBoardAuthorized.value),
    stage,
    teacherTile,
    studentTile,
  };
}

let classroom: ReturnType<typeof createClassroom> | null = null;

/** Detached, so tiles and actions share one copy whichever component asks first. */
export function useClassroom() {
  classroom ??= effectScope(true).run(createClassroom)!;
  return classroom;
}
