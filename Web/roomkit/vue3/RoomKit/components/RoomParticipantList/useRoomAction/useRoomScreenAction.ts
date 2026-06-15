import type { Component } from 'vue';
import { computed, reactive } from 'vue';
import { IconAllMembersShareScreen, IconHostShareScreen, TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { DeviceType, RoomParticipantRole } from 'tuikit-atomicx-vue3';

const { participantWithScreen, disableAllDevices } = useRoomParticipantState();
const { currentRoom } = useRoomState();

export default function useRoomScreenAction(): {
  key: string;
  label: string;
  icon: Component;
  handler: () => void;
} {
  const { t } = useUIKit();
  let stateForScreenShare = false;
  async function toggleAllScreenShare() {
    await disableAllDevices({
      deviceType: DeviceType.ScreenShare,
      disable: stateForScreenShare,
    });
  }

  function toggleRoomScreen() {
    stateForScreenShare = !currentRoom.value?.isAllScreenShareDisabled;
    if (participantWithScreen.value && participantWithScreen.value.role === RoomParticipantRole.GeneralUser) {
      TUIMessageBox.confirm({
        title: t(
          'ParticipantList.ConfirmHostAdminOnlyShare',
        ),
        content: t(
          'ParticipantList.TerminateOtherShare',
        ),
        confirmText: t('ParticipantList.Confirm'),
        cancelText: t('ParticipantList.Cancel'),
        callback: async (action) => {
          if (action === 'confirm') {
            toggleAllScreenShare();
          }
        },
      });
      return;
    }
    toggleAllScreenShare();
  }

  const roomScreenAction = reactive({
    key: 'AllScreenShareAction',
    label: computed(() =>
      currentRoom.value?.isAllScreenShareDisabled
        ? t('ParticipantList.AllCanShare')
        : t('ParticipantList.HostAdminOnlyShare'),
    ),
    icon: computed(() =>
      currentRoom.value?.isAllScreenShareDisabled
        ? IconAllMembersShareScreen
        : IconHostShareScreen,
    ),
    handler: toggleRoomScreen,
  });

  return roomScreenAction;
}
