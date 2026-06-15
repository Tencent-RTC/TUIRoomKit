import type { Component } from 'vue';
import { computed, reactive, markRaw } from 'vue';
import { TUIToast, TOAST_TYPE, IconChatForbidden, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant, RoomUser } from 'tuikit-atomicx-vue3';

const { t } = useUIKit();
const { disableUserMessage, messageDisabledUserList } = useRoomParticipantState();

export function useMessageAction(
  { targetParticipant }: { targetParticipant: RoomParticipant | RoomUser },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const isMessageDisabled = computed(() => (targetParticipant as RoomParticipant)?.isMessageDisabled
    || messageDisabledUserList.value?.some(user => user.userId === targetParticipant.userId));
  const chatControl = reactive({
    key: 'chatAction',
    icon: markRaw(IconChatForbidden),
    label: computed(() =>
      isMessageDisabled.value ? t('ParticipantList.EnableChat') : t('ParticipantList.DisableChat'),
    ),
    handler: async () => {
      try {
        await disableUserMessage({
          userId: targetParticipant.userId,
          disable: !isMessageDisabled.value,
        });
      } catch (_error: any) {
        TUIToast({
          type: TOAST_TYPE.ERROR,
          message: t('ParticipantList.DisableChatFailed'),
        });
      }
    },
  });

  return chatControl;
}
