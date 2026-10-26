import type { CSSProperties, ReactNode } from 'react';
import GridLayout from './GridLayout';
import SingleLayout from './SingleLayout';
import SpeakerLayout from './SpeakerLayout';
import ParticipantViewOverlay from '../ParticipantViewOverlayPC/ParticipantViewOverlayPC';
import { RoomLayoutTemplate } from '../../../core/types';
import type { RoomParticipant, VideoStreamType } from 'tuikit-atomicx-react/room';
import type { StreamInfo } from '../useParticipantStreams';
import './RoomViewPC.scss';

export interface RoomViewPCProps {
  layoutTemplate: RoomLayoutTemplate;
  /** Forwarded to every tile so a read-only surface can drop the more menu. */
  hideActions?: boolean;
  /** Drops the built-in overlay so a host-supplied participantViewUI replaces it. */
  hideOverlay?: boolean;
  onStreamDoubleClick?: (streamInfo: StreamInfo) => void;
  participantViewUISlot?: (scope: { participant: RoomParticipant; streamType: VideoStreamType }) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function RoomViewPC({
  layoutTemplate,
  hideActions,
  hideOverlay,
  onStreamDoubleClick,
  participantViewUISlot,
  className,
  style,
}: RoomViewPCProps) {
  const isSpeakerLayout = layoutTemplate === RoomLayoutTemplate.SidebarLayout
    || layoutTemplate === RoomLayoutTemplate.CinemaLayout;

  const renderParticipantViewUI = (slotProps: { participant: RoomParticipant; streamType: VideoStreamType }) => (
    <>
      {!hideOverlay && (
        <ParticipantViewOverlay
          participant={slotProps.participant}
          streamType={slotProps.streamType}
          hideActions={hideActions}
        />
      )}
      {participantViewUISlot?.(slotProps)}
    </>
  );

  let layout: ReactNode = null;
  if (layoutTemplate === RoomLayoutTemplate.SingleLayout) {
    layout = <SingleLayout participantViewUISlot={renderParticipantViewUI} />;
  } else if (layoutTemplate === RoomLayoutTemplate.GridLayout) {
    layout = (
      <GridLayout
        onStreamDoubleClick={streamInfo => onStreamDoubleClick?.(streamInfo)}
        participantViewUISlot={renderParticipantViewUI}
      />
    );
  } else if (isSpeakerLayout) {
    layout = (
      <SpeakerLayout
        layoutTemplate={layoutTemplate}
        onStreamDoubleClick={streamInfo => onStreamDoubleClick?.(streamInfo)}
        participantViewUISlot={renderParticipantViewUI}
      />
    );
  }

  return (
    <div className={['room-view', className].filter(Boolean).join(' ')} style={style}>
      {layout}
    </div>
  );
}

export default RoomViewPC;
