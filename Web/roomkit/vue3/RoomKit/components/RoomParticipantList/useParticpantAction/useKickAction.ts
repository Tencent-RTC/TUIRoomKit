import type { Component } from 'vue';
import { reactive, markRaw, computed } from 'vue';
import { useUIKit, IconKickOut, TUIMessageBox } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant, RoomUser } from 'tuikit-atomicx-vue3';

const { t } = useUIKit();
const { kickUser } = useRoomParticipantState();
export function useKickAction(
  { targetParticipant }: { targetParticipant: RoomParticipant | RoomUser },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const displayName = computed(() => (targetParticipant as RoomParticipant).nameCard || targetParticipant.userName || targetParticipant.userId);

  async function kickUserFunc() {
    TUIMessageBox.confirm({
      title: t('ParticipantList.Note'),
      content: t('ParticipantList.ConfirmKick', {
        name: displayName.value,
      }),
      confirmText: t('ParticipantList.Confirm'),
      cancelText: t('ParticipantList.Cancel'),
      callback: async (action) => {
        if (action === 'confirm') {
          await kickUser({
            userId: targetParticipant.userId,
          });
        }
      },
    });
  }
  const kickAction = reactive({
    key: 'kick',
    icon: markRaw(IconKickOut),
    label: t('ParticipantList.KickOut'),
    style: {
      color: '#FF0000',
    },
    handler: kickUserFunc,
  });
  return kickAction;
}
