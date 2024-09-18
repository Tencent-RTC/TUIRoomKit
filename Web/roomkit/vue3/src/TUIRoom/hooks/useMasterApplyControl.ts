// Raise hands to speak logic
import { onBeforeUnmount, computed, watch } from 'vue';
import TUIRoomEngine, {
  TUIRoomEvents,
  TUIRequestAction,
  TUIRequest,
  TUIRequestCallbackType,
  TUIErrorCode,
} from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from './useRoomEngine';
import TUIMessage from '../components/common/base/Message/index';
import { MESSAGE_DURATION } from '../constants/message';
import { useRoomStore, UserInfo } from '../stores/room';
import { storeToRefs } from 'pinia';
import { useI18n } from '../locales';
import logger from '../utils/common/logger';
import { useBasicStore } from '../stores/basic';
import TUINotification from '../components/common/base/Notification';
import { isMobile } from '../utils/environment';

const roomEngine = useGetRoomEngine();

export default function () {
  const roomStore = useRoomStore();
  const basicStore = useBasicStore();
  const { applyToAnchorList } = storeToRefs(roomStore);
  const { showApplyUserList } = storeToRefs(basicStore);
  const { t } = useI18n();
  let notification: { close: Function } | null;
  const applyToAnchorUserIdList = computed(() =>
    applyToAnchorList.value.map(item => item.userId)
  );
  const applyToAnchorUserCount = computed(() => applyToAnchorList.value.length);

  // ------ The following handles common user operations ---------

  // new: Receive an application from a user
  function onRequestReceived(eventInfo: { request: TUIRequest }) {
    const { requestAction, requestId, userId, timestamp } = eventInfo.request;
    if (requestAction === TUIRequestAction.kRequestToTakeSeat) {
      // User application for stage
      userId &&
        roomStore.addApplyToAnchorUser({ userId, requestId, timestamp });
    }
  }

  // The remote user cancels the application to connect to the stage
  function onRequestCancelled(eventInfo: {
    requestId: string;
    userId: string;
  }) {
    const { requestId } = eventInfo;
    roomStore.removeApplyToAnchorUser(requestId);
  }

  // The remote user's request is handled by other administrators/hosts.
  function onRequestProcessed(eventInfo: {
    requestId: string;
    userId: string;
  }) {
    const { requestId } = eventInfo;
    roomStore.removeApplyToAnchorUser(requestId);
  }

  // Handle user requests
  async function handleUserApply(applyUserId: string, agree: boolean) {
    try {
      // TUIRoomCore.replySpeechApplication(applyUserId, agree);
      const userInfo = roomStore.userInfoObj[applyUserId];
      const requestId = userInfo.applyToAnchorRequestId;
      if (requestId) {
        await roomEngine.instance?.responseRemoteRequest({
          requestId,
          agree,
        });
        roomStore.removeApplyToAnchorUser(requestId);
      } else {
        logger.warn(
          'Failed to process the stage application. The data is abnormal. Please try again！',
          userInfo
        );
      }
    } catch (error: any) {
      if (error.code === TUIErrorCode.ERR_ALL_SEAT_OCCUPIED) {
        TUIMessage({ type: 'warning', message: t('The stage is full') });
      } else {
        logger.error('Failure to process a user request', error);
      }
    }
  }

  // agree user to stage
  async function agreeUserOnStage(userInfo: UserInfo) {
    try {
      const requestId = userInfo.applyToAnchorRequestId;
      if (requestId) {
        await roomEngine.instance?.responseRemoteRequest({
          requestId,
          agree: true,
        });
        roomStore.removeApplyToAnchorUser(requestId);
      } else {
        logger.warn(
          'Failed to process the stage application. The data is abnormal. Please try again！',
          userInfo
        );
      }
    } catch (error: any) {
      if (error.code === TUIErrorCode.ERR_ALL_SEAT_OCCUPIED) {
        TUIMessage({ type: 'warning', message: t('The stage is full') });
      } else {
        logger.error('Failed application for consent to go on stage', error);
      }
    }
  }

  // reject user to stage
  async function denyUserOnStage(userInfo: UserInfo) {
    const requestId = userInfo.applyToAnchorRequestId;
    if (requestId) {
      await roomEngine.instance?.responseRemoteRequest({
        requestId,
        agree: false,
      });
      roomStore.removeApplyToAnchorUser(requestId);
    } else {
      logger.warn(
        'Failed to process the stage application. The data is abnormal. Please try again！',
        userInfo
      );
    }
  }

  // Process all users’ requests to access the microphone
  async function handleAllUserApply(isAgreeOrRejectAllUserApply: boolean) {
    let hasErrorOccurred = false;
    const applyUserList = applyToAnchorList.value.map(item => ({
      userId: item.userId,
      userName: item.nameCard || item.userName,
      applyToAnchorRequestId: item.applyToAnchorRequestId,
    }));
    for (const { applyToAnchorRequestId } of applyUserList) {
      const action = isAgreeOrRejectAllUserApply ? 'Agree' : 'Reject';
      const actionFailedMessage = `${action} sb on stage failed, please retry`;
      try {
        if (applyToAnchorRequestId) {
          await roomEngine.instance?.responseRemoteRequest({
            requestId: applyToAnchorRequestId,
            agree: isAgreeOrRejectAllUserApply,
          });
          roomStore.removeApplyToAnchorUser(applyToAnchorRequestId);
        }
      } catch (error) {
        if (!hasErrorOccurred) {
          logger.error(actionFailedMessage);
          TUIMessage({
            type: 'warning',
            message: t('The stage is full'),
            duration: MESSAGE_DURATION.NORMAL,
          });
          hasErrorOccurred = true;
        }
      }
    }
  }

  TUIRoomEngine.once('ready', () => {
    roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
    roomEngine.instance?.on(
      TUIRoomEvents.onRequestCancelled,
      onRequestCancelled
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onRequestProcessed,
      onRequestProcessed
    );
  });

  onBeforeUnmount(() => {
    roomEngine.instance?.off(
      TUIRoomEvents.onRequestReceived,
      onRequestReceived
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onRequestCancelled,
      onRequestCancelled
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onRequestProcessed,
      onRequestProcessed
    );
  });

  // --------- The following handles the moderator’s active operations ----------

  // Invite users to the stage
  async function inviteUserOnStage(userInfo: UserInfo) {
    const { userId } = userInfo;
    const request = await roomEngine.instance?.takeUserOnSeatByAdmin({
      seatIndex: -1,
      userId,
      timeout: 60,
      requestCallback: (callbackInfo: {
        requestCallbackType: TUIRequestCallbackType;
        userId: string;
        code: TUIErrorCode;
      }) => {
        const { requestCallbackType, userId, code } = callbackInfo;
        const userName = roomStore.getUserName(userId);
        roomStore.removeInviteToAnchorUser(userId);
        switch (requestCallbackType) {
          case TUIRequestCallbackType.kRequestAccepted:
            TUIMessage({
              type: 'success',
              message: `${userName || userId} ${t('accepted the invitation to the stage')}`,
              duration: MESSAGE_DURATION.NORMAL,
            });
            break;
          case TUIRequestCallbackType.kRequestRejected:
            TUIMessage({
              type: 'warning',
              message: `${userName || userId} ${t('declined the invitation to the stage')}`,
              duration: MESSAGE_DURATION.NORMAL,
            });
            break;
          case TUIRequestCallbackType.kRequestTimeout:
            TUIMessage({
              type: 'warning',
              message: t('The invitation to sb to go on stage has timed out', {
                name: userName || userId,
              }),
              duration: MESSAGE_DURATION.NORMAL,
            });
            break;
          case TUIRequestCallbackType.kRequestError:
            if (code === TUIErrorCode.ERR_REQUEST_ID_REPEAT) {
              TUIMessage({
                type: 'warning',
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
      roomStore.addInviteToAnchorUser({ userId, requestId: request.requestId });
    }
  }

  // Cancel invite users to the stage
  function cancelInviteUserOnStage(userInfo: UserInfo) {
    const { userId, inviteToAnchorRequestId } = userInfo;
    roomStore.removeInviteToAnchorUser(userId);
    if (inviteToAnchorRequestId) {
      roomEngine.instance?.cancelRequest({
        requestId: inviteToAnchorRequestId,
      });
    }
  }

  // Invite to step down
  function kickUserOffStage(userInfo: UserInfo) {
    roomEngine.instance?.kickUserOffSeatByAdmin({
      seatIndex: -1,
      userId: userInfo.userId,
    });
  }

  const handleConfirm = async (
    onlyOneUserTakeStage: boolean,
    userId: string
  ) => {
    if (isMobile) {
      basicStore.setSidebarOpenStatus(true);
      basicStore.setSidebarName('apply');
    } else {
      if (onlyOneUserTakeStage) {
        handleUserApply(userId, true);
      } else {
        basicStore.setShowApplyUserList(true);
      }
    }
  };

  const handleCancel = async (
    onlyOneUserTakeStage: boolean,
    userId: string
  ) => {
    if (!isMobile && onlyOneUserTakeStage) {
      handleUserApply(userId, false);
    }
  };

  function hideApplyList() {
    basicStore.setShowApplyUserList(false);
  }

  function handleShowNotification() {
    watch(applyToAnchorUserIdList, (newVal, oldVal) => {
      if (newVal.length === oldVal.length && newVal === oldVal) {
        return;
      }
      if (newVal.length === 0) {
        notification && notification.close();
        notification = null;
        return;
      }
      const onlyOneUserTakeStage = newVal.length === 1;
      const firstUser = applyToAnchorList.value[0];
      const lastIndex = applyToAnchorList.value.length - 1;
      const userName =
        applyToAnchorList.value[lastIndex]?.nameCard ||
        applyToAnchorList.value[lastIndex]?.userName ||
        applyToAnchorList.value[lastIndex]?.userId;
      const message = onlyOneUserTakeStage
        ? `${userName} ${t('Applying for the stage')}`
        : `${userName} ${t('and so on number people applying to stage', { number: applyToAnchorList.value.length })}`;
      const confirmButtonText = isMobile
        ? t('Check')
        : onlyOneUserTakeStage
          ? t('Agree to the stage')
          : t('Check');
      const cancelButtonText = isMobile
        ? undefined
        : onlyOneUserTakeStage
          ? t('Reject')
          : t('Neglect');
      const confirm = () =>
        handleConfirm(onlyOneUserTakeStage, firstUser?.userId);
      const cancel = () =>
        handleCancel(onlyOneUserTakeStage, firstUser?.userId);
      notification = TUINotification({
        message,
        confirmButtonText,
        cancelButtonText,
        confirm,
        cancel,
      });
    });
  }

  return {
    t,
    roomStore,
    showApplyUserList,
    hideApplyList,
    applyToAnchorUserCount,
    applyToAnchorList,
    // Process the user's application for accessing the stage (agree/reject)
    handleUserApply,
    // Allow ordinary users to take the stage
    agreeUserOnStage,
    // Reject ordinary users to take the stage
    denyUserOnStage,
    // Invite users to the stage
    inviteUserOnStage,
    // Cancel invite users to the stage
    cancelInviteUserOnStage,
    // Kick the user off the stage
    kickUserOffStage,
    // Handle all user requests
    handleAllUserApply,
    handleShowNotification,
  };
}
