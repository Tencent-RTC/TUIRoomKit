import { computed } from 'vue';
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
