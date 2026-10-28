import { computed, ref, watch } from 'vue';
import {
  DeviceStatus,
  RoomParticipantRole,
  VideoStreamType,
  useRoomParticipantState,
} from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

type Comparator<T> = (a: T, b: T) => -1 | 0 | 1;

function combineComparators<T>(...comparators: Comparator<T>[]): Comparator<T> {
  return (a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
}

function createComparator<T>(
  rule: (data1: T, data2: T) => boolean,
): Comparator<T> {
  return (a, b) => {
    if (rule(a, b) && rule(b, a)) {
      return 0;
    }
    if (rule(a, b)) {
      return -1;
    }
    if (rule(b, a)) {
      return 1;
    }
    return 0;
  };
}

export type StreamInfo = {
  participant: RoomParticipant;
  streamType: VideoStreamType;
};

/** Layouts hide the video under the overlay's camera-off mask: two layers clipped to the
    same radius anti-alias separately, so the black video would show as corner ticks. */
export function isCameraOff({ participant, streamType }: StreamInfo): boolean {
  return streamType === VideoStreamType.Camera && participant.cameraStatus !== DeviceStatus.On;
}

/** Sorted camera streams + optional screen share, for conference layout surfaces. */
export function useParticipantStreams() {
  const {
    localParticipant,
    participantList,
    participantWithScreen,
  } = useRoomParticipantState();

  const compareParticipants = combineComparators(
    createComparator((user: RoomParticipant) =>
      user.role === RoomParticipantRole.Owner,
    ),
    createComparator((user: RoomParticipant) =>
      user.userId === localParticipant.value?.userId,
    ),
    createComparator((user: RoomParticipant) =>
      user.role === RoomParticipantRole.Admin,
    ),
    createComparator((user: RoomParticipant) =>
      user.screenShareStatus === DeviceStatus.On,
    ),
    createComparator((user: RoomParticipant) =>
      user.cameraStatus === DeviceStatus.On
      && user.microphoneStatus === DeviceStatus.On,
    ),
    createComparator((user: RoomParticipant) =>
      user.cameraStatus === DeviceStatus.On,
    ),
    createComparator((user: RoomParticipant) =>
      user.microphoneStatus === DeviceStatus.On,
    ),
  );

  const sortedParticipantCameraList = computed<StreamInfo[]>(() =>
    [...participantList.value]
      .sort(compareParticipants)
      .map(participant => ({
        participant,
        streamType: VideoStreamType.Camera,
      })),
  );

  const participantStreamList = computed<StreamInfo[]>(() => {
    const result: StreamInfo[] = [];
    if (participantWithScreen.value) {
      result.push({
        participant: participantWithScreen.value,
        streamType: VideoStreamType.Screen,
      });
    }
    result.push(...sortedParticipantCameraList.value);
    return result;
  });

  return {
    sortedParticipantCameraList,
    participantStreamList,
    participantWithScreen,
  };
}

/** Silence grace for the current speaker before the picture may move to someone else. */
const SPEAKER_HOLD = 1000;

function findLoudestId(volumes: Map<string, number>): string {
  let loudestId = '';
  let loudest = 0;
  volumes.forEach((volume, userId) => {
    if (volume > loudest) {
      loudest = volume;
      loudestId = userId;
    }
  });
  return loudestId;
}

/** The current speaker, held through short silences; nothing until someone speaks. */
function useCurrentSpeaker() {
  const { localParticipant, participantList, speakingUsers } = useRoomParticipantState();

  const currentSpeakerId = ref('');
  let currentSpeakerLastHeardAt = 0;

  function pickSpeaker(volumes: Map<string, number>) {
    // People who left the room disappear from speakingUsers; drop a stale id first.
    if (currentSpeakerId.value && !volumes.has(currentSpeakerId.value)) {
      currentSpeakerId.value = '';
      currentSpeakerLastHeardAt = 0;
    }

    // A muted local track still reports volume, so it must not win the picture.
    const candidates = new Map(volumes);
    if (localParticipant.value?.microphoneStatus === DeviceStatus.Off) {
      candidates.delete(localParticipant.value.userId);
    }

    const speakerId = currentSpeakerId.value;
    const speakerVolume = candidates.get(speakerId);
    if (speakerId && speakerVolume !== undefined && speakerVolume > 0) {
      currentSpeakerLastHeardAt = Date.now();
      return;
    }

    const loudestId = findLoudestId(candidates);
    if (!loudestId) {
      return;
    }
    if (!speakerId || Date.now() - currentSpeakerLastHeardAt >= SPEAKER_HOLD) {
      currentSpeakerId.value = loudestId;
      currentSpeakerLastHeardAt = Date.now();
    }
  }

  watch(speakingUsers, pickSpeaker, { deep: true });

  const currentSpeaker = computed<RoomParticipant | undefined>(() => {
    if (!currentSpeakerId.value) {
      return undefined;
    }
    if (localParticipant.value?.userId === currentSpeakerId.value) {
      return localParticipant.value;
    }
    return participantList.value.find(item => item.userId === currentSpeakerId.value);
  });

  return { currentSpeaker };
}

/**
 * Picks for surfaces that hold a single stream.
 * - speakerStream: the current speaker's camera, or self until anyone speaks.
 * - stageStream: a screen share first, then speakerStream.
 */
export function useSingleStageStream() {
  const { localParticipant, participantWithScreen } = useRoomParticipantState();
  const { currentSpeaker } = useCurrentSpeaker();

  const speakerStream = computed<StreamInfo | null>(() => {
    const participant = currentSpeaker.value ?? localParticipant.value;
    return participant ? { participant, streamType: VideoStreamType.Camera } : null;
  });

  const stageStream = computed<StreamInfo | null>(() => {
    const sharer = participantWithScreen.value;
    return sharer ? { participant: sharer, streamType: VideoStreamType.Screen } : speakerStream.value;
  });

  return { speakerStream, stageStream };
}
