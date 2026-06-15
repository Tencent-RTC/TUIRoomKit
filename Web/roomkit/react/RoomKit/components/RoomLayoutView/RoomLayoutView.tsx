import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  RoomLayoutTemplate,
  RoomType,
  RoomView,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { StandardParticipantViewUI } from './StandardParticipantViewUI';
import type {
  RoomParticipant,
  VideoStreamType,
} from 'tuikit-atomicx-react/room';

export interface ParticipantViewSlotProps {
  /** Participant whose stream is being decorated. May be `null` for placeholder tiles. */
  participant: RoomParticipant | null;
  /** Stream type of the underlying tile (camera or screen share). */
  streamType: VideoStreamType;
}

export interface RoomLayoutViewProps {
  /** Currently selected layout template. Treated as a controlled prop. */
  layoutTemplate?: RoomLayoutTemplate;
  /** Fired when the layout should switch in response to participant/screen-share changes. */
  onLayoutTemplateChange?: (template: RoomLayoutTemplate) => void;
  /**
   * Custom render prop for each participant tile. When omitted, the default
   * `StandardParticipantViewUI` is rendered for `Standard` rooms.
   */
  renderParticipantView?: (props: ParticipantViewSlotProps) => ReactNode;
}

export function RoomLayoutView({
  layoutTemplate,
  onLayoutTemplateChange,
  renderParticipantView,
}: RoomLayoutViewProps) {
  const { currentRoom } = useRoomState();
  const { participantList, participantWithScreen } = useRoomParticipantState();

  // Latest-ref pattern keeps the watch effects subscribed once while the
  // parent stays free to recreate its callback / pass shifting state values.
  const currentRoomRef = useRef(currentRoom);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  const layoutTemplateRef = useRef(layoutTemplate);
  useEffect(() => {
    layoutTemplateRef.current = layoutTemplate;
  }, [layoutTemplate]);

  const onLayoutTemplateChangeRef = useRef(onLayoutTemplateChange);
  useEffect(() => {
    onLayoutTemplateChangeRef.current = onLayoutTemplateChange;
  }, [onLayoutTemplateChange]);

  // Mirror Vue `watch(participantWithScreen, (newVal, oldVal) => ...)`:
  // only fire when the value transitions from falsy to truthy. Keep the
  // initial render silent by recording the value first.
  const prevHasScreenRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    const hasScreen = !!participantWithScreen;
    const prev = prevHasScreenRef.current;
    prevHasScreenRef.current = hasScreen;
    if (
      currentRoomRef.current?.roomType === RoomType.Standard
      && hasScreen
      && !prev
    ) {
      onLayoutTemplateChangeRef.current?.(RoomLayoutTemplate.SidebarLayout);
    }
  }, [participantWithScreen]);

  // Mirror Vue `watch(() => participantList.length + (participantWithScreen ? 1 : 0), ...)`:
  // collapse to grid layout the moment the room shrinks back to a single
  // effective stream. Skip the initial render for parity with Vue `watch`.
  const streamCount = participantList.length + (participantWithScreen ? 1 : 0);
  const isFirstStreamCountWatch = useRef(true);
  useEffect(() => {
    if (isFirstStreamCountWatch.current) {
      isFirstStreamCountWatch.current = false;
      return;
    }
    if (
      currentRoomRef.current?.roomType === RoomType.Standard
      && streamCount === 1
      && layoutTemplateRef.current !== RoomLayoutTemplate.GridLayout
    ) {
      onLayoutTemplateChangeRef.current?.(RoomLayoutTemplate.GridLayout);
    }
  }, [streamCount]);

  const renderTile = ({
    participant,
    streamType,
  }: ParticipantViewSlotProps): ReactNode => {
    if (renderParticipantView) {
      return renderParticipantView({ participant, streamType });
    }
    if (currentRoom?.roomType === RoomType.Standard) {
      return (
        <StandardParticipantViewUI
          participant={participant}
          streamType={streamType}
        />
      );
    }
    return null;
  };

  return (
    <RoomView
      layoutTemplate={layoutTemplate}
      renderParticipantView={renderTile}
    />
  );
}
