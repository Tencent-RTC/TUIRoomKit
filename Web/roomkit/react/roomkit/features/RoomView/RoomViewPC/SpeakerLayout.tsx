import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import {
  FillMode,
  RoomParticipantView,
  VideoStreamType,
} from 'tuikit-atomicx-react/room';
import { RoomLayoutTemplate } from '../../../core/types';
import { isCameraOff, useParticipantStreams } from '../useParticipantStreams';
import type { StreamInfo, TileSlotScope } from '../useParticipantStreams';
import './SpeakerLayout.scss';

export interface SpeakerLayoutProps {
  layoutTemplate: RoomLayoutTemplate;
  /** The stage picture; the first stream in display order when omitted. */
  stageStream?: StreamInfo | null;
  onStreamDoubleClick?: (streamInfo: StreamInfo) => void;
  participantViewUISlot?: (scope: TileSlotScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

function isSameStream(a: StreamInfo, b: StreamInfo) {
  return a.participant.userId === b.participant.userId
    && a.streamType === b.streamType;
}

function videoClassName(streamInfo: StreamInfo) {
  return [
    'speaker-layout-video',
    isCameraOff(streamInfo) && 'is-hidden',
    streamInfo.streamType === VideoStreamType.Screen && 'is-screen',
  ].filter(Boolean).join(' ');
}

export function SpeakerLayout({
  layoutTemplate,
  stageStream,
  onStreamDoubleClick,
  participantViewUISlot,
  className,
  style,
}: SpeakerLayoutProps) {
  const { sortedParticipantCameraList, participantStreamList, participantWithScreen } = useParticipantStreams();

  const enlargeStreamInfo: StreamInfo | null = stageStream ?? participantStreamList[0] ?? null;

  const sideStreamInfoList: StreamInfo[] = [];
  if (participantWithScreen) {
    const screenStream: StreamInfo = {
      participant: participantWithScreen,
      streamType: VideoStreamType.Screen,
    };
    if (!enlargeStreamInfo || !isSameStream(screenStream, enlargeStreamInfo)) {
      sideStreamInfoList.push(screenStream);
    }
  }
  // Keep all camera tiles in the strip, matching AtomicX SpeakerLayout.
  sideStreamInfoList.push(...sortedParticipantCameraList);

  function handleStreamViewDblclick(streamInfo: StreamInfo, event: ReactMouseEvent) {
    // Capture runs before a covering whiteboard can stop the click. The more chip
    // still opts out, so opening that menu does not also swap the stage.
    const { target } = event;
    if (target instanceof Element && target.closest('.participant-view-overlay-more')) {
      return;
    }
    onStreamDoubleClick?.(streamInfo);
  }

  const streamContainerClass = layoutTemplate === RoomLayoutTemplate.CinemaLayout
    ? 'is-cinema'
    : 'is-sidebar';

  return (
    <div className={['speaker-layout', streamContainerClass, className].filter(Boolean).join(' ')} style={style}>
      {enlargeStreamInfo?.participant && (
        <div className="speaker-layout-main">
          <div className="speaker-layout-tile speaker-layout-tile-main">
            <div className={videoClassName(enlargeStreamInfo)}>
              <RoomParticipantView
                participant={enlargeStreamInfo.participant}
                streamType={enlargeStreamInfo.streamType}
                fillMode={FillMode.Fit}
                lazyLoad={{ enable: false }}
              />
            </div>
            {participantViewUISlot?.({ ...enlargeStreamInfo, tileRole: 'stage' })}
          </div>
        </div>
      )}

      <div className="speaker-layout-list">
        <div className="speaker-layout-list-content">
          {sideStreamInfoList.map(streamInfo => (
            <div
              key={`${streamInfo.participant.userId}_${streamInfo.streamType}`}
              className="speaker-layout-tile"
              onDoubleClickCapture={event => handleStreamViewDblclick(streamInfo, event)}
            >
              <div className={videoClassName(streamInfo)}>
                <RoomParticipantView
                  participant={streamInfo.participant}
                  streamType={streamInfo.streamType}
                  fillMode={FillMode.Fit}
                />
              </div>
              {participantViewUISlot?.({ ...streamInfo, tileRole: 'thumb' })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpeakerLayout;
