// 举手发言逻辑
// 主持人：同意/拒绝用户的申请发言，踢人下麦，邀请用户上麦，取消邀请用户上麦

import { onBeforeUnmount } from 'vue';
import TUIRoomEngine, { TUIRoomEvents, TUIRequestAction, TUIRequest, TUIRequestCallbackType, TUIErrorCode } from '@tencentcloud/tuiroom-engine-electron';
import useGetRoomEngine from './useRoomEngine';
import TUIMessage from '../components/common/base/Message/index';
import { MESSAGE_DURATION } from '../constants/message';
import { useRoomStore, UserInfo } from '../stores/room';
import { storeToRefs } from 'pinia';
import { useI18n } from '../locales';
import logger from '../utils/common/logger';

const roomEngine = useGetRoomEngine();

export default function () {
  const roomStore = useRoomStore();
  const { applyToAnchorList } = storeToRefs(roomStore);
  const { t } = useI18n();

  // ------ 以下处理普通用户操作 ---------

  // new: 收到来自用户的上麦申请
  function onRequestReceived(eventInfo: { request: TUIRequest }) {
    const { requestAction, requestId, userId, timestamp } = eventInfo.request;
    if (requestAction === TUIRequestAction.kRequestToTakeSeat) {
      // 用户申请上麦
      userId && roomStore.addApplyToAnchorUser({ userId, requestId, timestamp });
    }
  }

  // 远端用户取消上麦申请
  function onRequestCancelled(eventInfo: { requestId: string, userId: string }) {
    const { requestId } = eventInfo;
    roomStore.removeApplyToAnchorUser(requestId);
  }

  // 远端用户的请求被其他 管理员/房主 处理事件
  function onRequestProcessed(eventInfo: { requestId: string, userId: string }) {
    const { requestId } = eventInfo;
    roomStore.removeApplyToAnchorUser(requestId);
  }

  // 处理用户请求
  async function handleUserApply(applyUserId: string, agree: boolean) {
    try {
      // TUIRoomCore.replySpeechApplication(applyUserId, agree);
      const userInfo = roomStore.remoteUserObj[applyUserId];
      const requestId = userInfo.applyToAnchorRequestId;
      if (requestId) {
        await roomEngine.instance?.responseRemoteRequest({
          requestId,
          agree,
        });
        roomStore.removeApplyToAnchorUser(requestId);
      } else {
        logger.warn('处理上台申请失败，数据异常，请重试！', userInfo);
      }
    } catch (error: any) {
      if (error.code === TUIErrorCode.ERR_ALL_SEAT_OCCUPIED) {
        TUIMessage({ type: 'warning', message: t('The current number of people on stage has reached the limit') });
      } else {
        logger.error('Failure to process a user request', error);
      }
    }
  }

  // 同意用户上台
  async function agreeUserOnStage(userInfo: UserInfo) {
    try {
      const requestId = userInfo.applyToAnchorRequestId;
      if (requestId) {
        await roomEngine.instance?.responseRemoteRequest({ requestId, agree: true });
        roomStore.removeApplyToAnchorUser(requestId);
      } else {
        logger.warn('同意上台申请失败，数据异常，请重试！', userInfo);
      }
    } catch (error: any) {
      if (error.code === TUIErrorCode.ERR_ALL_SEAT_OCCUPIED) {
        TUIMessage({ type: 'warning', message: t('The current number of people on stage has reached the limit') });
      } else {
        logger.error('Failed application for consent to go on stage', error);
      }
    }
  }

  // 拒绝用户上台
  async function denyUserOnStage(userInfo: UserInfo) {
    const requestId = userInfo.applyToAnchorRequestId;
    if (requestId) {
      await roomEngine.instance?.responseRemoteRequest({
        requestId,
        agree: false,
      });
      roomStore.removeApplyToAnchorUser(requestId);
    } else {
      logger.warn('拒绝上台申请失败，数据异常，请重试！', userInfo);
    }
  }

  // 处理全部用户上麦请求
  async function handleAllUserApply(isAgreeOrRejectAllUserApply: boolean) {
    const applyUserList = applyToAnchorList.value.map(item => ({
      userId: item.userId,
      userName: item.userName,
      applyToAnchorRequestId: item.applyToAnchorRequestId,
    }));
    for (const { userId, userName, applyToAnchorRequestId } of applyUserList) {
      const action = isAgreeOrRejectAllUserApply ? 'Agree' : 'Reject';
      const actionFailedMessage = `${action} ${userName || userId} 上台申请失败，请重试！`;
      try {
        if (applyToAnchorRequestId) {
          await roomEngine.instance?.responseRemoteRequest({
            requestId: applyToAnchorRequestId,
            agree: isAgreeOrRejectAllUserApply,
          });
          roomStore.removeApplyToAnchorUser(applyToAnchorRequestId);
        }
      } catch (error) {
        logger.error(actionFailedMessage);
        TUIMessage({
          type: 'warning',
          message: t(`${action} sb on stage failed, please retry`, { name: userName || userId }),
          duration: MESSAGE_DURATION.NORMAL,
        });
      }
    }
  }

  TUIRoomEngine.once('ready', () => {
    roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
    roomEngine.instance?.on(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
    roomEngine.instance?.on(TUIRoomEvents.onRequestProcessed, onRequestProcessed);
  });

  onBeforeUnmount(() => {
    roomEngine.instance?.off(TUIRoomEvents.onRequestReceived, onRequestReceived);
    roomEngine.instance?.off(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
    roomEngine.instance?.off(TUIRoomEvents.onRequestProcessed, onRequestProcessed);
  });

  // --------- 以下处理主持人主动操作 ----------

  // 邀请用户上台
  async function inviteUserOnStage(userInfo: UserInfo) {
    const { userId } = userInfo;
    const request = await roomEngine.instance?.takeUserOnSeatByAdmin({
      seatIndex: -1,
      userId,
      timeout: 60,
      requestCallback: (callbackInfo: {
        requestCallbackType: TUIRequestCallbackType, userId: string, code: TUIErrorCode
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
              message: t('The invitation to sb to go on stage has timed out', { name: userName || userId }),
              duration: MESSAGE_DURATION.NORMAL,
            });
            break;
          case TUIRequestCallbackType.kRequestError:
            if (code === TUIErrorCode.ERR_REQUEST_ID_REPEAT) {
              TUIMessage({
                type: 'warning',
                message: t('This member has already received the same request, please try again later'),
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

  // 取消邀请用户上台
  function cancelInviteUserOnStage(userInfo: UserInfo) {
    const { userId, inviteToAnchorRequestId } = userInfo;
    roomStore.removeInviteToAnchorUser(userId);
    if (inviteToAnchorRequestId) {
      roomEngine.instance?.cancelRequest({ requestId: inviteToAnchorRequestId });
    }
  }

  // 邀请下台
  function kickUserOffStage(userInfo: UserInfo) {
    roomEngine.instance?.kickUserOffSeatByAdmin({
      seatIndex: -1,
      userId: userInfo.userId,
    });
  }

  return {
    // 处理用户上麦申请（同意/拒绝）
    handleUserApply,
    // 同意普通用户上台
    agreeUserOnStage,
    // 拒绝普通用户上台
    denyUserOnStage,
    // 邀请用户上台
    inviteUserOnStage,
    // 取消邀请用户上台
    cancelInviteUserOnStage,
    // 将用户踢下麦
    kickUserOffStage,
    // 处理所有用户请求
    handleAllUserApply,
  };
}
