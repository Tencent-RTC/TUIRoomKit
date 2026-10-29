import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { MirrorType, VideoStreamType, useDeviceState } from 'tuikit-atomicx-react/room';
import ParticipantViewOverlayMobile from '../ParticipantViewOverlayMobile/ParticipantViewOverlayMobile';
import GridLayoutMobile from './GridLayoutMobile';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import './RoomViewMobile.scss';

export interface RoomViewMobileProps {
  /** Drops the built-in overlay so a host-supplied participantViewUI replaces it. */
  hideOverlay?: boolean;
  /** Drawing on the share owns its touches: no zoom, no page swipe. */
  shareLocked?: boolean;
  /** Whose camera the share page's corner window shows; no window when omitted. */
  pipParticipant?: RoomParticipant | null;
  participantViewUISlot?: (scope: {
    participant: RoomParticipant;
    streamType: VideoStreamType;
    inPip?: boolean;
  }) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * The phone stage is always the 9:16 gallery. It takes no layout template: the
 * speaker and cinema layouts are desktop-only, and a share gets a page of its own
 * inside the gallery instead of switching layouts. Who the share page's corner
 * window follows is the host's call, passed in as `pipParticipant`.
 */
export function RoomViewMobile({
  hideOverlay,
  shareLocked,
  pipParticipant,
  participantViewUISlot,
  className,
  style,
}: RoomViewMobileProps) {
  const { isFrontCamera, localMirrorType, switchCamera, switchMirror } = useDeviceState();
  /* Same rule as SwitchCameraButton: the back camera never mirrors, and the front
     camera's setting comes back on the return trip. Held here rather than on the tile,
     because paging remounts the tile and would drop it. */
  const frontMirrorRef = useRef(MirrorType.Auto);
  const mirrorSeededRef = useRef(false);
  if (!mirrorSeededRef.current) {
    mirrorSeededRef.current = true;
    frontMirrorRef.current = isFrontCamera ? localMirrorType : MirrorType.Auto;
  }

  async function handleFlipCamera() {
    /* Vue re-reads isFrontCamera after the switch inside the await; the captured
       pre-switch value is the stable equivalent here. */
    const wasFront = isFrontCamera;
    await switchCamera({ isFrontCamera: !wasFront });
    if (!wasFront) {
      await switchMirror({ mirror: frontMirrorRef.current });
      return;
    }
    frontMirrorRef.current = localMirrorType;
    await switchMirror({ mirror: MirrorType.Disable });
  }

  const renderParticipantViewUI = (slotProps: {
    participant: RoomParticipant;
    streamType: VideoStreamType;
    inPip?: boolean;
  }) => (
    <>
      {!hideOverlay && slotProps.streamType !== VideoStreamType.Screen && (
        <ParticipantViewOverlayMobile
          participant={slotProps.participant}
          streamType={slotProps.streamType}
          inPip={slotProps.inPip}
          onFlipCamera={() => {
            void handleFlipCamera();
          }}
        />
      )}
      {participantViewUISlot?.(slotProps)}
    </>
  );

  return (
    <div className={['room-view-mobile', className].filter(Boolean).join(' ')} style={style}>
      <GridLayoutMobile
        shareLocked={shareLocked}
        pipParticipant={pipParticipant}
        participantViewUISlot={renderParticipantViewUI}
      />
    </div>
  );
}

export default RoomViewMobile;
