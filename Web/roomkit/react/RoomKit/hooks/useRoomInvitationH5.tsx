import { useCallback, useEffect, useRef, useState } from 'react';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-react';
import { createPortal } from 'react-dom';
import {
  RoomEvent,
  useRoomState,
  CallRejectReason,
} from 'tuikit-atomicx-react/room';
import { RoomInvitationH5 } from '../components/RoomInvitationH5';
import type { AcceptCallParams } from './useRoomInvitation';
import type { RoomInvitationH5Options } from '../components/RoomInvitationH5/RoomInvitationH5';
import type { RoomCall, RoomInfo } from 'tuikit-atomicx-react/room';

const DEFAULT_AVATAR_URL = 'https://web.sdk.qcloud.com/component/TUIKit/assets/avatar_16.png';

function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/**
 * Options for configuring H5 room invitation behavior.
 */
export interface UseRoomInvitationH5Options {
  onAcceptCall?: (params: AcceptCallParams) => void;
}

/**
 * React hook for handling incoming room invitations on H5.
 *
 * Subscribes to RoomEngine call events and surfaces the full-screen
 * call-style invitation overlay (`RoomInvitationH5`). The returned React
 * node MUST be rendered by the caller so it stays inside the host app's
 * React tree and inherits providers such as `UIKitProvider`.
 */
export function useRoomInvitationH5(
  options?: UseRoomInvitationH5Options,
): React.ReactNode {
  const { t } = useUIKit();
  const {
    currentRoom,
    subscribeEvent,
    unsubscribeEvent,
    rejectCall,
    acceptCall,
  } = useRoomState();
  const { onAcceptCall } = options ?? {};
  const currentRoomRef = useLatestRef(currentRoom);
  const onAcceptCallRef = useLatestRef(onAcceptCall);
  const tRef = useLatestRef(t);

  const [activeInvitation, setActiveInvitation]
    = useState<RoomInvitationH5Options | null>(null);

  const dismiss = useCallback(() => setActiveInvitation(null), []);

  useEffect(() => {
    const handleRoomCallReceived = ({
      roomInfo,
      call,
    }: {
      roomInfo: RoomInfo;
      call: RoomCall;
    }) => {
      const { caller } = call;

      if (currentRoomRef.current?.roomId) {
        rejectCall({
          roomId: roomInfo.roomId,
          reason: CallRejectReason.InOtherRoom,
        });
        return;
      }

      setActiveInvitation({
        inviterName: caller.userName,
        inviterAvatar: caller.avatarUrl || DEFAULT_AVATAR_URL,
        roomName: roomInfo.roomName,
        hostName: roomInfo.roomOwner.userName,
        participantCount: roomInfo.participantCount ?? 0,
        duration: 60,
        onCancel: () => {
          rejectCall({ roomId: roomInfo.roomId });
          dismiss();
        },
        onAccept: () => {
          acceptCall({ roomId: roomInfo.roomId });
          onAcceptCallRef.current?.({
            roomId: roomInfo.roomId,
            password: roomInfo.password || '',
            roomType: roomInfo.roomType,
          } satisfies AcceptCallParams);
          dismiss();
        },
        onTimeout: dismiss,
      });
    };

    const onRoomCallHandledByOtherDevice = () => {
      TUIToast.info({
        message: tRef.current('RoomInvitation.HandleByOtherDevice'),
      });
      dismiss();
    };

    subscribeEvent(RoomEvent.onCallReceived, handleRoomCallReceived);
    subscribeEvent(
      RoomEvent.onCallHandledByOtherDevice,
      onRoomCallHandledByOtherDevice,
    );

    return () => {
      unsubscribeEvent(RoomEvent.onCallReceived, handleRoomCallReceived);
      unsubscribeEvent(
        RoomEvent.onCallHandledByOtherDevice,
        onRoomCallHandledByOtherDevice,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribeEvent, unsubscribeEvent, rejectCall, acceptCall]);

  if (!activeInvitation) {
    return null;
  }

  return createPortal(
    <RoomInvitationH5 options={activeInvitation} />,
    document.body,
  );
}
