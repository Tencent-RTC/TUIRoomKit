import type { ReactNode } from 'react';
import {
  RoomLayoutTemplate,
  RoomView,
} from 'tuikit-atomicx-react/room';
import { ParticipantViewUIH5 } from './ParticipantViewUIH5';
import type { RoomParticipant, VideoStreamType } from 'tuikit-atomicx-react/room';

export interface ParticipantViewSlotPropsH5 {
  /** Participant whose stream is being decorated. */
  participant: RoomParticipant;
  /** Stream type of the underlying tile (camera or screen share). */
  streamType: VideoStreamType;
}

export interface RoomLayoutViewH5Props {
  /**
   * Render prop for customizing per-participant video tiles. React equivalent
   * of Vue's `#participantViewUI` scoped slot.
   */
  renderParticipantView?: (slotProps: ParticipantViewSlotPropsH5) => ReactNode;
}

export function RoomLayoutViewH5({ renderParticipantView }: RoomLayoutViewH5Props) {
  const renderTile = ({ participant, streamType }: ParticipantViewSlotPropsH5): ReactNode => {
    if (renderParticipantView) {
      return renderParticipantView({ participant, streamType });
    }
    return (
      <ParticipantViewUIH5
        participant={participant}
        streamType={streamType}
      />
    );
  };

  return (
    <RoomView
      layoutTemplate={RoomLayoutTemplate.MobileLayout}
      renderParticipantView={renderTile}
    />
  );
}
