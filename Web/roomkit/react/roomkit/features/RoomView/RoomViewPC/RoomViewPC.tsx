import type { CSSProperties, ReactNode } from 'react';
import GridLayout from './GridLayout';
import SingleLayout from './SingleLayout';
import SpeakerLayout from './SpeakerLayout';
import ParticipantViewOverlay from '../ParticipantViewOverlayPC/ParticipantViewOverlayPC';
import { RoomLayoutTemplate } from '../../../core/types';
import type { StreamInfo, TileSlotScope } from '../useParticipantStreams';
import './RoomViewPC.scss';

/* Renders the template it is given. Which stream takes the stage, and what a double-click
   does, belong to the host: it passes `stageStream` and listens to `onStreamDoubleClick`. */
export interface RoomViewPCProps {
  layoutTemplate: RoomLayoutTemplate;
  /** Single and speaker layouts: the stage picture; the first stream in display order when omitted. */
  stageStream?: StreamInfo | null;
  /** Forwarded to every tile so a read-only surface can drop the more menu. */
  hideActions?: boolean;
  /** Drops the built-in overlay so a host-supplied participantViewUI replaces it. */
  hideOverlay?: boolean;
  onStreamDoubleClick?: (streamInfo: StreamInfo) => void;
  participantViewUISlot?: (scope: TileSlotScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function RoomViewPC({
  layoutTemplate,
  stageStream,
  hideActions,
  hideOverlay,
  onStreamDoubleClick,
  participantViewUISlot,
  className,
  style,
}: RoomViewPCProps) {
  const isSpeakerLayout = layoutTemplate === RoomLayoutTemplate.SidebarLayout
    || layoutTemplate === RoomLayoutTemplate.CinemaLayout;

  const renderParticipantViewUI = (slotProps: TileSlotScope) => (
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
    layout = <SingleLayout stageStream={stageStream} participantViewUISlot={renderParticipantViewUI} />;
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
        stageStream={stageStream}
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
