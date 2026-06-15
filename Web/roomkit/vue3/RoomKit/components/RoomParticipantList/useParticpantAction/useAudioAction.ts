import type { Component } from 'vue';
import { computed } from 'vue';
import {
  IconAudioOpen,
  IconAudioClose,
  TUIToast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { DeviceType } from 'tuikit-atomicx-vue3';
import type { RoomParticipant } from 'tuikit-atomicx-vue3';

const { t } = useUIKit();

export function useMuteAudioAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const { closeParticipantDevice } = useRoomParticipantState();
  async function muteUserAudio() {
    await closeParticipantDevice({
      userId: targetParticipant.userId,
      deviceType: DeviceType.Microphone,
    });
  }
  return {
    key: 'muteAudio',
    icon: IconAudioOpen,
    label: t('ParticipantList.Mute'),
    handler: muteUserAudio,
  };
}

export function useUnmuteAudioAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const { inviteToOpenDevice } = useRoomParticipantState();
  const displayName = computed(() => targetParticipant.nameCard || targetParticipant.userName || targetParticipant.userId);

  async function unmuteUserAudio() {
    await inviteToOpenDevice({
      userId: targetParticipant.userId,
      device: DeviceType.Microphone,
      timeout: 30,
    });
    TUIToast.info({
      message: `${t('ParticipantList.InviteMicSent', { name: displayName.value })}`,
    });
  }

  return {
    key: 'unmuteAudio',
    icon: IconAudioClose,
    label: t('ParticipantList.Unmute'),
    handler: unmuteUserAudio,
  };
}
