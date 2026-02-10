import { onMounted } from 'vue';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { RoomEvent, useRoomState, CallRejectReason } from 'tuikit-atomicx-vue3/room';
import { hideRoomInvitation, showRoomInvitation } from '../components';
import type { RoomCall, RoomInfo } from 'tuikit-atomicx-vue3/room';

/**
 * Parameters for accepting a room call
 */
export interface AcceptCallParams {
  roomId: string;
  password?: string;
  [key: string]: string | undefined;
}

/**
 * Options for configuring room invitation behavior
 */
export interface UseRoomInvitationOptions {
  onAcceptCall?: (params: AcceptCallParams) => void;
}

/**
 * Composable for handling room invitation logic
 * Manages room call events and invitation UI
 */
export function useRoomInvitation(options?: UseRoomInvitationOptions) {
  const { t } = useUIKit();
  const { currentRoom, subscribeEvent, rejectCall, acceptCall } = useRoomState();

  // Handle incoming room call
  const handleRoomCallReceived = ({ roomInfo, call }: { roomInfo: RoomInfo; call: RoomCall }) => {
    const { caller } = call;

    // If already in a room, reject the call
    if (currentRoom.value?.roomId) {
      rejectCall({ roomId: roomInfo.roomId, reason: CallRejectReason.InOtherRoom });
      return;
    }

    // Show invitation UI
    showRoomInvitation({
      inviterName: caller.userName,
      inviterAvatar: caller.avatarUrl,
      roomName: roomInfo.roomName,
      hostName: roomInfo.roomOwner.userName,
      participantCount: roomInfo.participantCount ?? 0,
      duration: 60,
      onCancel: () => {
        rejectCall({ roomId: roomInfo.roomId });
      },
      onAccept: () => {
        acceptCall({ roomId: roomInfo.roomId });

        // Trigger callback with room parameters
        if (options?.onAcceptCall) {
          options.onAcceptCall({
            roomId: roomInfo.roomId,
            password: roomInfo.password || '',
          });
        }
      },
    });
  };

  // Handle room call handled by other device
  const onRoomCallHandledByOtherDevice = () => {
    TUIToast.info({ message: t('RoomInvitation.HandleByOtherDevice') });
    hideRoomInvitation();
  };

  // Subscribe to room events on mount
  onMounted(() => {
    subscribeEvent(RoomEvent.onCallReceived, handleRoomCallReceived);
    subscribeEvent(RoomEvent.onCallHandledByOtherDevice, onRoomCallHandledByOtherDevice);
  });
}
