import { computed, reactive, ref, Ref } from 'vue';
import {
  TUIRequest,
  TUIRequestCallbackType,
  TUIErrorCode,
} from '@tencentcloud/tuiroom-engine-js';
import {
  IconInviteOnStage,
  IconDenyOnStage,
  IconOnStage,
  IconOffStage,
} from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../../../locales';
import { roomService } from '../../../../services';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { MESSAGE_DURATION } from '../../../../constants/message';
import useUserState from '../index';
import { UserInfo, UserAction, ActionType } from '../../../type';
import useRoomEngine from '../../../../hooks/useRoomEngine';

const { t } = useI18n();

const roomEngine = useRoomEngine();

const invitingUserOnSeatRequestObj: Ref<Record<string, TUIRequest>> = ref({});

export function useInviteUserOnSeat(
  userInfo: UserInfo
): ActionType<UserAction> {
  const { onSeatUserList } = useUserState();

  const invitingCurrentUserOnSeatRequest = computed(() => {
    return invitingUserOnSeatRequestObj.value[userInfo.userId];
  });

  async function toggleInviteUserOnSeat() {
    if (invitingCurrentUserOnSeatRequest.value) {
      await roomEngine.instance?.cancelRequest({
        requestId: invitingCurrentUserOnSeatRequest.value.requestId,
      });
      delete invitingUserOnSeatRequestObj.value[userInfo.userId];
    } else {
      if (onSeatUserList.value.length === roomService.roomStore.maxSeatCount) {
        TUIToast({
          type: TOAST_TYPE.WARNING,
          message: `${t('The stage is full')}`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      const request = await roomEngine.instance?.takeUserOnSeatByAdmin({
        seatIndex: -1,
        userId: userInfo.userId,
        timeout: 60,
        requestCallback: (callbackInfo: {
          requestCallbackType: TUIRequestCallbackType;
          userId: string;
          code: TUIErrorCode;
        }) => {
          const { requestCallbackType, code } = callbackInfo;
          delete invitingUserOnSeatRequestObj.value[userInfo.userId];
          switch (requestCallbackType) {
            case TUIRequestCallbackType.kRequestAccepted:
              TUIToast({
                type: TOAST_TYPE.SUCCESS,
                message: `${userInfo.displayName} ${t('accepted the invitation to the stage')}`,
                duration: MESSAGE_DURATION.NORMAL,
              });
              break;
            case TUIRequestCallbackType.kRequestRejected:
              TUIToast({
                type: TOAST_TYPE.WARNING,
                message: `${userInfo.displayName} ${t('declined the invitation to the stage')}`,
                duration: MESSAGE_DURATION.NORMAL,
              });
              break;
            case TUIRequestCallbackType.kRequestTimeout:
              TUIToast({
                type: TOAST_TYPE.WARNING,
                message: t(
                  'The invitation to sb to go on stage has timed out',
                  {
                    name: userInfo.displayName,
                  }
                ),
                duration: MESSAGE_DURATION.NORMAL,
              });
              break;
            case TUIRequestCallbackType.kRequestError:
              if (code === TUIErrorCode.ERR_REQUEST_ID_REPEAT) {
                TUIToast({
                  type: TOAST_TYPE.WARNING,
                  message: t(
                    'This member has already received the same request, please try again later'
                  ),
                  duration: MESSAGE_DURATION.NORMAL,
                });
              }
              break;
            default:
              break;
          }
        },
      });
      if (request && request.requestId) {
        invitingUserOnSeatRequestObj.value[userInfo.userId] = request;
      }
    }
  }

  const inviteUserOnSeat = reactive({
    key: UserAction.InviteOnSeatAction,
    icon: computed(() =>
      invitingCurrentUserOnSeatRequest.value
        ? IconDenyOnStage
        : IconInviteOnStage
    ),
    label: computed(() =>
      invitingCurrentUserOnSeatRequest.value
        ? t('Cancel stage')
        : t('Invite stage')
    ),
    handler: toggleInviteUserOnSeat,
  });
  return inviteUserOnSeat;
}

export function useAgreeUserOnSeat(userInfo: UserInfo): ActionType<UserAction> {
  const { seatApplicationRequestList } = useUserState();
  const onSeatRequest = computed(() => {
    return seatApplicationRequestList.value.find(
      (request: TUIRequest) => request.userId === userInfo.userId
    );
  });

  const agreeUserOnSeat = reactive({
    key: UserAction.AgreeOnSeatAction,
    icon: IconOnStage,
    label: t('Agree to the stage'),
    handler: async () => {
      if (onSeatRequest.value) {
        try {
          await roomEngine.instance?.responseRemoteRequest({
            requestId: onSeatRequest.value.requestId,
            agree: true,
          });
        } catch (error: any) {
          if (error.code === TUIErrorCode.ERR_ALL_SEAT_OCCUPIED) {
            TUIToast({
              type: TOAST_TYPE.WARNING,
              message: t('The stage is full'),
            });
          } else {
            console.error('Failure to response a user request', error);
          }
        }
      }
    },
  });
  return agreeUserOnSeat;
}

export function useDenyUserOnSeat(userInfo: UserInfo): ActionType<UserAction> {
  const { seatApplicationRequestList } = useUserState();
  const onSeatRequest = computed(() => {
    return seatApplicationRequestList.value.find(
      (request: TUIRequest) => request.userId === userInfo.userId
    );
  });
  const denyUserOnSeat = reactive({
    key: UserAction.DenyOnSeatAction,
    icon: IconDenyOnStage,
    label: t('Refuse stage'),
    handler: async () => {
      if (onSeatRequest.value) {
        try {
          await roomEngine.instance?.responseRemoteRequest({
            requestId: onSeatRequest.value.requestId,
            agree: false,
          });
        } catch (error: any) {
          console.error('Failure to response a user request', error);
        }
      }
    },
  });
  return denyUserOnSeat;
}

export function useKickUserOffSeat(userInfo: UserInfo): ActionType<UserAction> {
  async function kickUserOffSeatByAdmin(userInfo: UserInfo) {
    await roomEngine.instance?.kickUserOffSeatByAdmin({
      seatIndex: -1,
      userId: userInfo.userId,
    });
  }

  const kickUserOffSeat = reactive({
    key: UserAction.KickOffSeatAction,
    icon: IconOffStage,
    label: t('Step down'),
    handler: () => kickUserOffSeatByAdmin(userInfo),
  });
  return kickUserOffSeat;
}

export default function useSeatAction(userInfo: UserInfo) {
  return {
    inviteUserOnSeat: useInviteUserOnSeat(userInfo),
    agreeUserOnSeat: useAgreeUserOnSeat(userInfo),
    denyUserOnSeat: useDenyUserOnSeat(userInfo),
    kickUserOffSeat: useKickUserOffSeat(userInfo),
  };
}
