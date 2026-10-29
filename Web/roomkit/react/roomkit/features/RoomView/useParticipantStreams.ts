import { useEffect, useRef, useState } from 'react';
import {
  DeviceStatus,
  RoomParticipantRole,
  VideoStreamType,
  useRoomParticipantState,
} from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import { useShareParticipants } from '../Whiteboard/WhiteboardState';

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

/** What a layout hands each tile's overlay slot; `tileRole` tells the stage from a strip thumb. */
export type TileSlotScope = StreamInfo & {
  tileRole?: 'stage' | 'thumb';
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
  } = useShareParticipants();

  const compareParticipants = combineComparators(
    createComparator((user: RoomParticipant) =>
      user.role === RoomParticipantRole.Owner,
    ),
    createComparator((user: RoomParticipant) =>
      user.userId === localParticipant?.userId,
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

  const sortedParticipantCameraList: StreamInfo[] = [...participantList]
    .sort(compareParticipants)
    .map(participant => ({
      participant,
      streamType: VideoStreamType.Camera,
    }));

  const participantStreamList: StreamInfo[] = [];
  if (participantWithScreen) {
    participantStreamList.push({
      participant: participantWithScreen,
      streamType: VideoStreamType.Screen,
    });
  }
  participantStreamList.push(...sortedParticipantCameraList);

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

  const [currentSpeakerId, setCurrentSpeakerId] = useState('');
  const currentSpeakerIdRef = useRef('');
  const lastHeardAtRef = useRef(0);
  const localRef = useRef(localParticipant);
  localRef.current = localParticipant;
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    const volumes = speakingUsers;
    function setSpeaker(userId: string) {
      currentSpeakerIdRef.current = userId;
      setCurrentSpeakerId(userId);
    }
    // People who left the room disappear from speakingUsers; drop a stale id first.
    if (currentSpeakerIdRef.current && !volumes.has(currentSpeakerIdRef.current)) {
      setSpeaker('');
      lastHeardAtRef.current = 0;
    }

    // A muted local track still reports volume, so it must not win the picture.
    const candidates = new Map(volumes);
    const local = localRef.current;
    if (local?.microphoneStatus === DeviceStatus.Off) {
      candidates.delete(local.userId);
    }

    const speakerId = currentSpeakerIdRef.current;
    const speakerVolume = candidates.get(speakerId);
    if (speakerId && speakerVolume !== undefined && speakerVolume > 0) {
      lastHeardAtRef.current = Date.now();
      return;
    }

    const loudestId = findLoudestId(candidates);
    if (!loudestId) {
      return;
    }
    if (!speakerId || Date.now() - lastHeardAtRef.current >= SPEAKER_HOLD) {
      setSpeaker(loudestId);
      lastHeardAtRef.current = Date.now();
    }
  }, [speakingUsers]);

  let currentSpeaker: RoomParticipant | undefined;
  if (currentSpeakerId) {
    currentSpeaker = localParticipant?.userId === currentSpeakerId
      ? localParticipant
      : participantList.find(item => item.userId === currentSpeakerId);
  }

  return { currentSpeaker };
}

/**
 * Picks for surfaces that hold a single stream.
 * - speakerStream: the current speaker's camera, or self until anyone speaks.
 * - stageStream: a screen share first, then speakerStream.
 */
export function useSingleStageStream() {
  const { localParticipant, participantWithScreen } = useShareParticipants();
  const { currentSpeaker } = useCurrentSpeaker();

  const speakerParticipant = currentSpeaker ?? localParticipant;
  const speakerStream: StreamInfo | null = speakerParticipant
    ? { participant: speakerParticipant, streamType: VideoStreamType.Camera }
    : null;

  const stageStream: StreamInfo | null = participantWithScreen
    ? { participant: participantWithScreen, streamType: VideoStreamType.Screen }
    : speakerStream;

  return { speakerStream, stageStream };
}
