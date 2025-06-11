import { computed } from 'vue';
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';
import { useRoomStore } from '../../../../stores/room';
import useAudioAction from './useAudioAction';
import useChatAction from './useChatAction';
import useVideoAction from './useVideoAction';
import useTransferOwnerAction from './useTransferOwnerAction';
import useChangeNameCardAction from './useChangeNameCardAction/index';
import useKickUserAction from './useKickUserAction';
import useSeatAction from './useSeatAction';
import useAdminAction from './useAdminAction';
import { ActionType, UserAction, UserInfo } from '../../../type';
import { storeToRefs } from 'pinia';
import useUserState from '../index';

interface ObjectType {
  [key: string]: any;
}

export function useUserActions(option: {
  userInfo: UserInfo;
  actionList?: UserAction[];
}) {
  const { userInfo, actionList } = option;
  const roomStore = useRoomStore();
  const { isFreeSpeakMode, isSpeakAfterTakingSeatMode, localUser } =
    storeToRefs(roomStore);
  const { seatApplicationRequestList } = useUserState();
  const isTargetUserMySelf = computed(
    () => roomStore.localUser.userId === userInfo.userId
  );
  const isTargetUserRoomOwner = computed(
    () => userInfo.userRole === TUIRole.kRoomOwner
  );
  const isTargetUserGeneral = computed(
    () => userInfo.userRole === TUIRole.kGeneralUser
  );
  const isTargetUserAnchor = computed(() => userInfo?.isOnSeat === true);
  const isTargetUserAudience = computed(() => userInfo?.isOnSeat !== true);
  const { isMaster, isAdmin } = storeToRefs(roomStore);
  const isCanOperateCurrentUser = computed(
    () =>
      (isMaster.value && !isTargetUserRoomOwner.value) ||
      (isAdmin.value && isTargetUserGeneral.value) ||
      isTargetUserMySelf.value
  );

  const audioAction = useAudioAction(userInfo);
  const videoAction = useVideoAction(userInfo);
  const chatAction = useChatAction(userInfo);
  const transferOwnerAction = useTransferOwnerAction(userInfo);
  const adminAction = useAdminAction(userInfo);
  const nameCardAction = useChangeNameCardAction(userInfo);
  const kickUserAction = useKickUserAction(userInfo);
  const { inviteUserOnSeat, agreeUserOnSeat, denyUserOnSeat, kickUserOffSeat } =
    useSeatAction(userInfo);

  const isUserApplyingToAnchor = computed(() => {
    return seatApplicationRequestList.value.find(
      request => request.userId === userInfo.userId
    );
  });
  const agreeOrDenyStageList = isUserApplyingToAnchor.value
    ? [agreeUserOnSeat, denyUserOnSeat]
    : [];
  const inviteStageList =
    isTargetUserAudience.value && !isUserApplyingToAnchor.value
      ? [inviteUserOnSeat]
      : [];
  const onStageControlList = isTargetUserAnchor.value
    ? [audioAction, videoAction, kickUserOffSeat]
    : [];

  const controlListObj: ObjectType = {
    freeSpeak: {
      [TUIRole.kRoomOwner]: [
        audioAction,
        videoAction,
        chatAction,
        adminAction,
        transferOwnerAction,
        kickUserAction,
        nameCardAction,
      ],
      [TUIRole.kAdministrator]: [
        audioAction,
        videoAction,
        chatAction,
        nameCardAction,
      ],
    },
    speakAfterTakeSeat: {
      [TUIRole.kRoomOwner]: [
        ...inviteStageList,
        ...onStageControlList,
        ...agreeOrDenyStageList,
        adminAction,
        transferOwnerAction,
        chatAction,
        kickUserAction,
        nameCardAction,
      ],
      [TUIRole.kAdministrator]: [
        ...inviteStageList,
        ...onStageControlList,
        ...agreeOrDenyStageList,
        chatAction,
        nameCardAction,
      ],
    },
  };

  const controlList = computed(() => {
    if (!userInfo || !userInfo.isInRoom) {
      return [];
    }
    if (!isCanOperateCurrentUser.value) {
      return [];
    }
    if (isTargetUserMySelf.value) {
      return [nameCardAction];
    }
    if (isFreeSpeakMode.value) {
      return (
        controlListObj.freeSpeak[
          localUser.value.userRole as keyof ObjectType
        ] || []
      );
    }
    if (isSpeakAfterTakingSeatMode.value) {
      return (
        controlListObj.speakAfterTakeSeat[
          localUser.value.userRole as keyof ObjectType
        ] || []
      );
    }
    return [];
  });

  if (actionList && actionList.length > 0) {
    return actionList?.reduce((result: ActionType<UserAction>[], action) => {
      const actionItem = controlList.value.find(
        (item: ActionType<UserAction>) => item.key === action
      );
      if (actionItem) {
        result.push(actionItem);
      }
      return result;
    }, []);
  }
  return controlList.value;
}
