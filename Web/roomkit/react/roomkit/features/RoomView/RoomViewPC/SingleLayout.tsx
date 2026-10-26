import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  DeviceStatus,
  FillMode,
  RoomParticipantView,
  VideoStreamType,
  useRoomParticipantState,
} from 'tuikit-atomicx-react/room';
import { isCameraOff } from '../useParticipantStreams';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import './SingleLayout.scss';

export interface SingleLayoutProps {
  participantViewUISlot?: (scope: { participant: RoomParticipant; streamType: VideoStreamType }) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Silence grace for the current speaker before the picture may move to someone else. */
const SPEAKER_HOLD = 1000;

function hasVoice(volume: number | undefined): boolean {
  return volume !== undefined && volume > 0;
}

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

export function SingleLayout({
  participantViewUISlot,
  className,
  style,
}: SingleLayoutProps) {
  const {
    localParticipant,
    participantList,
    participantWithScreen,
    speakingUsers,
  } = useRoomParticipantState();

  const [currentSpeakerId, setCurrentSpeakerIdState] = useState('');
  const currentSpeakerIdRef = useRef('');
  const currentSpeakerLastHeardAtRef = useRef(0);
  const localParticipantRef = useRef(localParticipant);
  localParticipantRef.current = localParticipant;

  function setCurrentSpeaker(userId: string) {
    currentSpeakerIdRef.current = userId;
    setCurrentSpeakerIdState(userId);
    currentSpeakerLastHeardAtRef.current = Date.now();
  }

  function clearCurrentSpeaker() {
    currentSpeakerIdRef.current = '';
    setCurrentSpeakerIdState('');
    currentSpeakerLastHeardAtRef.current = 0;
  }

  function pickSpeaker(volumes: Map<string, number>) {
    // People who left the room disappear from speakingUsers; drop a stale id first.
    if (currentSpeakerIdRef.current && !volumes.has(currentSpeakerIdRef.current)) {
      clearCurrentSpeaker();
    }

    const candidates = new Map(volumes);
    const local = localParticipantRef.current;
    if (local?.microphoneStatus === DeviceStatus.Off) {
      candidates.delete(local.userId);
    }

    const speakerId = currentSpeakerIdRef.current;
    // Current speaker still talking: keep them even if someone else is louder.
    if (speakerId && hasVoice(candidates.get(speakerId))) {
      currentSpeakerLastHeardAtRef.current = Date.now();
      return;
    }

    const loudestId = findLoudestId(candidates);
    if (!loudestId) {
      return;
    }

    // No current speaker yet, or they have been quiet long enough to switch.
    const maySwitch = !speakerId || Date.now() - currentSpeakerLastHeardAtRef.current >= SPEAKER_HOLD;
    if (maySwitch) {
      setCurrentSpeaker(loudestId);
    }
  }

  const isFirstSpeakingWatchRef = useRef(true);
  useEffect(() => {
    if (isFirstSpeakingWatchRef.current) {
      isFirstSpeakingWatchRef.current = false;
      return;
    }
    pickSpeaker(speakingUsers);
  }, [speakingUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Resolves to nothing until someone speaks, and again once that person leaves. */
  const currentSpeaker = (() => {
    if (!currentSpeakerId) {
      return undefined;
    }
    if (localParticipant?.userId === currentSpeakerId) {
      return localParticipant;
    }
    return participantList.find(item => item.userId === currentSpeakerId);
  })();

  /** A share outranks the speaker, and the local camera is the resting state under both. */
  const stream = (() => {
    if (participantWithScreen) {
      return {
        participant: participantWithScreen,
        streamType: VideoStreamType.Screen,
        fillMode: FillMode.Fit,
      };
    }

    const participant = currentSpeaker ?? localParticipant;
    if (!participant) {
      return null;
    }
    return {
      participant,
      streamType: VideoStreamType.Camera,
      fillMode: FillMode.Fill,
    };
  })();

  return (
    <div className={['single-layout', className].filter(Boolean).join(' ')} style={style}>
      {stream && (
        <div className="single-layout-stream">
          <div className={isCameraOff(stream) ? 'single-layout-video is-hidden' : 'single-layout-video'}>
            <RoomParticipantView
              participant={stream.participant}
              streamType={stream.streamType}
              fillMode={stream.fillMode}
              lazyLoad={{ enable: false }}
            />
          </div>
          {participantViewUISlot?.({ participant: stream.participant, streamType: stream.streamType })}
        </div>
      )}
    </div>
  );
}

export default SingleLayout;
