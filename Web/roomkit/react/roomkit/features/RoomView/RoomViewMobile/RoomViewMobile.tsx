import { useRef, useState } from 'react';
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
const FLIP_TIMEOUT_MS = 5000;

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

  /* isFrontCamera only updates once switchCamera resolves, so overlapping flips would
     all aim the same way and save the back camera's Disable as the front setting.
     A flip that never settles frees the button after FLIP_TIMEOUT_MS; once a newer
     flip has started, the stale one neither applies its mirror nor clears the lock. */
  const [isPending, setIsPending] = useState(false);
  const isPendingRef = useRef(false);
  const flipIdRef = useRef(0);

  function setPending(value: boolean) {
    isPendingRef.current = value;
    setIsPending(value);
  }

  async function handleFlipCamera() {
    if (isPendingRef.current) {
      return;
    }
    const id = ++flipIdRef.current;
    setPending(true);
    const timer = setTimeout(() => {
      if (id === flipIdRef.current) {
        setPending(false);
      }
    }, FLIP_TIMEOUT_MS);
    try {
      // Captured before the await: hook values are render snapshots, unlike Vue refs.
      const toFront = !isFrontCamera;
      if (!toFront) {
        frontMirrorRef.current = localMirrorType;
      }
      await switchCamera({ isFrontCamera: toFront });
      if (id !== flipIdRef.current) {
        return;
      }
      await switchMirror({ mirror: toFront ? frontMirrorRef.current : MirrorType.Disable });
    } finally {
      clearTimeout(timer);
      if (id === flipIdRef.current) {
        setPending(false);
      }
    }
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
          flipPending={isPending}
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
