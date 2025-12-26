import { onMounted } from 'vue';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { RoomEvent, useRoomState, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { hideRoomInvitation, showRoomInvitation } from '../components';
import type { RoomCall, RoomInfo } from 'tuikit-atomicx-vue3/room';
import { CallRejectReason } from 'tuikit-atomicx-vue3';

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
  const { isMicrophoneTesting, isCameraTesting } = useDeviceState();

  // Get media parameters based on device testing state
  function getMediaParams() {
    const params: Record<string, string> = {};
    if (isCameraTesting.value) {
      Object.assign(params, { openCamera: 'true' });
    }
    if (isMicrophoneTesting.value) {
      Object.assign(params, { openMicrophone: 'true' });
    }
    return params;
  }

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
            ...getMediaParams(),
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

  return {
    handleRoomCallReceived,
    onRoomCallHandledByOtherDevice,
  };
}
