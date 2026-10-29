import type { CSSProperties, ReactNode } from 'react';
import {
  FillMode,
  RoomParticipantView,
  VideoStreamType,
} from 'tuikit-atomicx-react/room';
import { isCameraOff, useParticipantStreams } from '../useParticipantStreams';
import type { StreamInfo, TileSlotScope } from '../useParticipantStreams';
import './SingleLayout.scss';

export interface SingleLayoutProps {
  /** The one picture to show; the first stream in display order when omitted. */
  stageStream?: StreamInfo | null;
  participantViewUISlot?: (scope: TileSlotScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function SingleLayout({
  stageStream,
  participantViewUISlot,
  className,
  style,
}: SingleLayoutProps) {
  const { participantStreamList } = useParticipantStreams();

  const stream = stageStream ?? participantStreamList[0] ?? null;
  const isScreen = stream?.streamType === VideoStreamType.Screen;

  return (
    <div className={['single-layout', className].filter(Boolean).join(' ')} style={style}>
      {stream && (
        <div className="single-layout-stream">
          <div
            className={[
              'single-layout-video',
              isCameraOff(stream) && 'is-hidden',
              isScreen && 'is-screen',
            ].filter(Boolean).join(' ')}
          >
            <RoomParticipantView
              participant={stream.participant}
              streamType={stream.streamType}
              fillMode={isScreen ? FillMode.Fit : FillMode.Fill}
              lazyLoad={{ enable: false }}
            />
          </div>
          {participantViewUISlot?.({
            participant: stream.participant,
            streamType: stream.streamType,
            tileRole: 'stage',
          })}
        </div>
      )}
    </div>
  );
}

export default SingleLayout;
