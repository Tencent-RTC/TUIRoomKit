import type { Component } from 'vue';
import { computed } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { TUIToast, TOAST_TYPE, IconSetAdmin, IconRevokeAdmin, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant, RoomUser } from 'tuikit-atomicx-vue3';

const { t } = useUIKit();
const { setAdmin, revokeAdmin } = useRoomParticipantState();

export function useSetAdminAction(
  { targetParticipant }: { targetParticipant: RoomParticipant | RoomUser },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const displayName = computed(() => (targetParticipant as RoomParticipant).nameCard || targetParticipant.userName || targetParticipant.userId);

  return {
    key: 'setAdmin',
    icon: IconSetAdmin,
    label: t('ParticipantList.SetAdmin'),
    handler: async () => {
      try {
        await setAdmin({ userId: targetParticipant.userId });
        TUIToast({
          type: TOAST_TYPE.SUCCESS,
          message: t('ParticipantList.SetAdminSuccess', { name: displayName.value }),
        });
      } catch (_error) {
        if (_error && typeof _error === 'object' && 'code' in _error && _error?.code === TUIErrorCode.ERR_ADMIN_COUNT_LIMIT) {
          TUIToast.error({
            message: t('ParticipantList.AdminCountLimit'),
          });
          return;
        }
        TUIToast.error({
          message: t('ParticipantList.SetAdminFailed'),
        });
      }
    },
  };
}

export function useRevokeAdminAction(
  { targetParticipant }: { targetParticipant: RoomParticipant | RoomUser },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const displayName = computed(() => (targetParticipant as RoomParticipant).nameCard || targetParticipant.userName || targetParticipant.userId);

  return {
    key: 'revokeAdmin',
    icon: IconRevokeAdmin,
    label: t('ParticipantList.RemoveAdmin'),
    handler: () => {
      revokeAdmin({ userId: targetParticipant.userId });
      TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: t('ParticipantList.RemoveAdminSuccess', { name: displayName.value }),
      });
    },
  };
}
