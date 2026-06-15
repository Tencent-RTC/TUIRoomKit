import { computed } from 'vue';
import type { ComputedRef, CSSProperties, Ref } from 'vue';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomParticipantRole, DeviceStatus, RoomType } from 'tuikit-atomicx-vue3';
import { useSetAdminAction, useRevokeAdminAction } from './useAdminAction';
import { useMuteAudioAction, useUnmuteAudioAction } from './useAudioAction';
import { useKickAction } from './useKickAction';
import { useMessageAction } from './useMessageAction';
import { useNameCardAction } from './useNameCardAction';
import { useDemoteToAudienceAction, usePromoteToParticipantAction } from './useToggleWebinarRole';
import { useTransferOwnerAction } from './useTransferOwnerAction';
import { useMuteVideoAction, useUnmuteVideoAction } from './useVideoAction';
import type { RoomParticipant, RoomUser } from 'tuikit-atomicx-vue3';
import type { TUIIcon } from '@tencentcloud/uikit-base-component-vue3';

const {
  localParticipant,
  adminList,
} = useRoomParticipantState();

const { currentRoom } = useRoomState();
const isWebinar = computed(() => currentRoom.value?.roomType === RoomType.Webinar);
const isLocalOwner = computed(() => localParticipant.value?.role === RoomParticipantRole.Owner);
const isLocalAdmin = computed(() => localParticipant.value?.role === RoomParticipantRole.Admin
  || adminList.value?.some(admin => admin.userId === localParticipant.value?.userId));

export function useParticipantAction({ targetParticipant }: { targetParticipant: Ref<RoomParticipant> }): {
  controlList: ComputedRef<{ key: string; label: string; handler: () => void; icon?: typeof TUIIcon; style?: CSSProperties }[]>;
} {
  const targetIsMe = computed(() => targetParticipant.value.userId === localParticipant.value?.userId);
  const targetIsOwner = computed(() => targetParticipant.value.role === RoomParticipantRole.Owner);
  const targetIsAdmin = computed(() => targetParticipant.value.role === RoomParticipantRole.Admin);
  const targetIsGeneralUser = computed(() => targetParticipant.value.role === RoomParticipantRole.GeneralUser);

  const nameCardAction = useNameCardAction({ targetParticipant: targetParticipant.value });
  const messageAction = useMessageAction({ targetParticipant: targetParticipant.value });
  const kickAction = useKickAction({ targetParticipant: targetParticipant.value });

  const hasAudio = computed(() => targetParticipant.value.microphoneStatus === DeviceStatus.On);
  const hasVideo = computed(() => targetParticipant.value.cameraStatus === DeviceStatus.On);

  const controlList = computed(() => {
    const controlListResult: { key: string; label: string; handler: () => void }[] = [];
    // 设置观众：是大房间，我是房主并且目标用户不是我自己/我是管理员并且目标用户是普通用户或者我自己
    if (isWebinar.value && ((isLocalOwner.value && !targetIsMe.value) || (isLocalAdmin.value && (targetIsGeneralUser.value || targetIsMe.value)))) {
      const demoteToAudienceAction = useDemoteToAudienceAction({ targetParticipant: targetParticipant.value });
      controlListResult.push(demoteToAudienceAction);
    }
    // 音视频操作：我是房主/我是管理员且操作用户是普通用户
    if ((isLocalOwner.value || (isLocalAdmin.value && targetIsGeneralUser.value)) && !targetIsMe.value) {
      if (hasAudio.value) {
        const muteAudioAction = useMuteAudioAction({ targetParticipant: targetParticipant.value });
        controlListResult.push(muteAudioAction);
      } else {
        const unmuteAudioAction = useUnmuteAudioAction({ targetParticipant: targetParticipant.value });
        controlListResult.push(unmuteAudioAction);
      }
      if (!isWebinar.value) {
        if (hasVideo.value) {
          const muteVideoAction = useMuteVideoAction({ targetParticipant: targetParticipant.value });
          controlListResult.push(muteVideoAction);
        } else {
          const unmuteVideoAction = useUnmuteVideoAction({ targetParticipant: targetParticipant.value });
          controlListResult.push(unmuteVideoAction);
        }
      }
    }
    // 转移房主：不是大房间并且我是房主，目标用户不是房主
    if (!isWebinar.value && isLocalOwner.value && !targetIsOwner.value) {
      const transferOwnerAction = useTransferOwnerAction({ targetParticipant: targetParticipant.value });
      controlListResult.push(transferOwnerAction);
    }
    // 设置管理员：我是房主，目标用户是普通用户
    if (isLocalOwner.value && targetIsGeneralUser.value) {
      const setAdminAction = useSetAdminAction({ targetParticipant: targetParticipant.value });
      controlListResult.push(setAdminAction);
    }
    // 撤销管理员：我是房主，目标用户是管理员
    if (isLocalOwner.value && targetIsAdmin.value) {
      const revokeAdminAction = useRevokeAdminAction({ targetParticipant: targetParticipant.value });
      controlListResult.push(revokeAdminAction);
    }

    // 修改昵称：不是大房间 && 我是房主/我是管理员，目标用户是普通用户/目标用户是我自己
    if (!isWebinar.value && ((isLocalOwner.value || (isLocalAdmin.value && targetIsGeneralUser.value) || targetIsMe.value))) {
      controlListResult.push(nameCardAction);
    }
    // 禁止聊天：我是房主目标用户是普通用户或者管理员/我是管理员目标用户是普通用户
    if ((isLocalOwner.value && (targetIsGeneralUser.value || targetIsAdmin.value)) || (isLocalAdmin.value && targetIsGeneralUser.value)) {
      controlListResult.push(messageAction);
    }
    // 踢出房间：我是房主目标用户是普通用户或者管理员/我是管理员目标用户是普通用户
    if ((isLocalOwner.value && (targetIsGeneralUser.value || targetIsAdmin.value)) || (isLocalAdmin.value && targetIsGeneralUser.value)) {
      controlListResult.push(kickAction);
    }
    return controlListResult;
  });

  return {
    controlList,
  };
}

export function useAudienceAction({ targetAudience }: { targetAudience: RoomUser }): {
  controlList: ComputedRef<{ key: string; label: string; handler: () => void; icon?: typeof TUIIcon; style?: CSSProperties }[]>;
} {
  const targetIsMe = computed(() => targetAudience.userId === localParticipant.value?.userId);
  const targetIsAdmin = computed(() => adminList.value?.some(admin => admin.userId === targetAudience.userId));

  const setAdminAction = useSetAdminAction({ targetParticipant: targetAudience });
  const messageAction = useMessageAction({ targetParticipant: targetAudience });
  const kickAction = useKickAction({ targetParticipant: targetAudience });
  const revokeAdminAction = useRevokeAdminAction({ targetParticipant: targetAudience });
  const promoteToParticipantAction = usePromoteToParticipantAction({ targetParticipant: targetAudience });

  const controlList = computed(() => {
    const controlListResult: { key: string; label: string; handler: () => void }[] = [];
    // 设为嘉宾：是大房间，我是房主，或我是管理员且目标用户不是其他管理员
    if (
      isWebinar.value
      && (
        isLocalOwner.value
        || ((isLocalAdmin.value && !isLocalOwner.value) && (!targetIsAdmin.value || targetIsMe.value))
      )
    ) {
      controlListResult.push(promoteToParticipantAction);
    }
    // 设置管理员：我是房主，目标用户不是管理员并且不是我自己
    if (isLocalOwner.value && !targetIsAdmin.value && !targetIsMe.value) {
      controlListResult.push(setAdminAction);
    }
    // 撤销管理员：我是房主，目标用户是管理员
    if (isLocalOwner.value && targetIsAdmin.value) {
      controlListResult.push(revokeAdminAction);
    }
    // 禁止聊天：不是我自己 && （我是房主/我是管理员，目标用户不是管理员）
    if (!targetIsMe.value && (isLocalOwner.value || (isLocalAdmin.value && !targetIsAdmin.value))) {
      controlListResult.push(messageAction);
    }
    // 踢出房间：不是我自己 && （我是房主/我是管理员，目标用户不是管理员）
    if (!targetIsMe.value && (isLocalOwner.value || (isLocalAdmin.value && !targetIsAdmin.value))) {
      controlListResult.push(kickAction);
    }
    return controlListResult;
  });

  return {
    controlList,
  };
}
