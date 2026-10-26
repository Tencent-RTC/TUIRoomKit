import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  FillMode,
  RoomParticipantEvent,
  RoomParticipantView,
  VideoStreamType,
  useRoomParticipantState,
} from 'tuikit-atomicx-react/room';
import { RoomLayoutTemplate } from '../../../core/types';
import { isCameraOff, useParticipantStreams } from '../useParticipantStreams';
import type { RoomParticipant, RoomUser } from 'tuikit-atomicx-react/room';
import type { StreamInfo } from '../useParticipantStreams';
import './SpeakerLayout.scss';

export interface SpeakerLayoutProps {
  layoutTemplate: RoomLayoutTemplate;
  onStreamDoubleClick?: (streamInfo: StreamInfo) => void;
  participantViewUISlot?: (scope: { participant: RoomParticipant; streamType: VideoStreamType }) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

function isSameStream(a: StreamInfo, b: StreamInfo) {
  return a.participant.userId === b.participant.userId
    && a.streamType === b.streamType;
}

export function SpeakerLayout({
  layoutTemplate,
  onStreamDoubleClick,
  participantViewUISlot,
  className,
  style,
}: SpeakerLayoutProps) {
  const { sortedParticipantCameraList } = useParticipantStreams();
  const {
    localParticipant,
    participantListWithVideo,
    participantWithScreen,
    subscribeEvent,
    unsubscribeEvent,
  } = useRoomParticipantState();

  const [primaryStreamInfo, setPrimaryStreamInfo] = useState<StreamInfo | null>(null);

  const enlargeStreamInfo: StreamInfo | null = (() => {
    if (primaryStreamInfo) {
      return primaryStreamInfo;
    }
    if (participantWithScreen) {
      return {
        participant: participantWithScreen,
        streamType: VideoStreamType.Screen,
      };
    }
    if (participantListWithVideo.length > 0) {
      return {
        participant: participantListWithVideo[0],
        streamType: VideoStreamType.Camera,
      };
    }
    if (localParticipant) {
      return {
        participant: localParticipant,
        streamType: VideoStreamType.Camera,
      };
    }
    return null;
  })();

  const sideStreamInfoList = (() => {
    const result: StreamInfo[] = [];
    const enlarged = enlargeStreamInfo;

    if (participantWithScreen) {
      const screenStream: StreamInfo = {
        participant: participantWithScreen,
        streamType: VideoStreamType.Screen,
      };
      if (!enlarged || !isSameStream(screenStream, enlarged)) {
        result.push(screenStream);
      }
    }

    // Keep all camera tiles in the strip, matching AtomicX SpeakerLayout.
    result.push(...sortedParticipantCameraList);
    return result;
  })();

  function handleStreamViewDblclick(streamInfo: StreamInfo) {
    setPrimaryStreamInfo(streamInfo);
    onStreamDoubleClick?.(streamInfo);
  }

  const streamContainerClass = layoutTemplate === RoomLayoutTemplate.CinemaLayout
    ? 'is-cinema'
    : 'is-sidebar';

  // Vue watches the participant object identity; the userId is the stable equivalent here.
  const screenUserId = participantWithScreen?.userId;
  const prevScreenUserIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const oldUserId = prevScreenUserIdRef.current;
    prevScreenUserIdRef.current = screenUserId;
    setPrimaryStreamInfo((prev) => {
      if (!prev) {
        return prev;
      }
      const { streamType, participant } = prev;
      let next: StreamInfo | null = prev;
      if (!screenUserId && streamType === VideoStreamType.Screen && participant.userId === oldUserId) {
        next = null;
      }
      if (screenUserId && streamType !== VideoStreamType.Screen) {
        next = null;
      }
      return next;
    });
  }, [screenUserId]);

  useEffect(() => {
    function handleParticipantLeft({ userInfo }: { userInfo: RoomUser }) {
      setPrimaryStreamInfo(prev => (
        userInfo.userId === prev?.participant?.userId ? null : prev
      ));
    }
    subscribeEvent(RoomParticipantEvent.onParticipantLeft, handleParticipantLeft);
    return () => {
      unsubscribeEvent(RoomParticipantEvent.onParticipantLeft, handleParticipantLeft);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={['speaker-layout', streamContainerClass, className].filter(Boolean).join(' ')} style={style}>
      {enlargeStreamInfo?.participant && (
        <div className="speaker-layout-main">
          <div className="speaker-layout-tile speaker-layout-tile-main">
            <div className={isCameraOff(enlargeStreamInfo) ? 'speaker-layout-video is-hidden' : 'speaker-layout-video'}>
              <RoomParticipantView
                participant={enlargeStreamInfo.participant}
                streamType={enlargeStreamInfo.streamType}
                fillMode={FillMode.Fit}
                lazyLoad={{ enable: false }}
              />
            </div>
            {participantViewUISlot?.(enlargeStreamInfo)}
          </div>
        </div>
      )}

      <div className="speaker-layout-list">
        <div className="speaker-layout-list-content">
          {sideStreamInfoList.map(streamInfo => (
            <div
              key={`${streamInfo.participant.userId}_${streamInfo.streamType}`}
              className="speaker-layout-tile"
              onDoubleClick={() => handleStreamViewDblclick(streamInfo)}
            >
              <div className={isCameraOff(streamInfo) ? 'speaker-layout-video is-hidden' : 'speaker-layout-video'}>
                <RoomParticipantView
                  participant={streamInfo.participant}
                  streamType={streamInfo.streamType}
                  fillMode={FillMode.Fit}
                />
              </div>
              {participantViewUISlot?.(streamInfo)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpeakerLayout;
