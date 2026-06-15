import type { Component } from 'vue';
import { computed } from 'vue';
import { TUIToast, TOAST_TYPE, IconVideoOpen, IconVideoClose, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { DeviceType } from 'tuikit-atomicx-vue3';
import type { RoomParticipant } from 'tuikit-atomicx-vue3';

export function useMuteVideoAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const { closeParticipantDevice } = useRoomParticipantState();
  const { t } = useUIKit();
  return {
    key: 'muteVideo',
    icon: IconVideoOpen,
    label: t('ParticipantList.DisableVideo'),
    handler: async () => {
      await closeParticipantDevice({
        userId: targetParticipant.userId,
        deviceType: DeviceType.Camera,
      });
    },
  };
}

export function useUnmuteVideoAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const { inviteToOpenDevice } = useRoomParticipantState();
  const displayName = computed(() => targetParticipant.nameCard || targetParticipant.userName || targetParticipant.userId);
  const { t } = useUIKit();

  return {
    key: 'unmuteVideo',
    icon: IconVideoClose,
    label: t('ParticipantList.EnableVideo'),
    handler: async () => {
      await inviteToOpenDevice({
        userId: targetParticipant.userId,
        device: DeviceType.Camera,
        timeout: 30,
      });
      TUIToast({
        type: TOAST_TYPE.INFO,
        message: `${t('ParticipantList.InviteCameraSent', { name: displayName.value })}`,
      });
    },
  };
}
