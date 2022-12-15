// 举手发言逻辑
// 主持人：同意/拒绝用户的申请发言，踢人下麦，邀请用户上麦，取消邀请用户上麦

import { onBeforeUnmount } from 'vue';
import TUIRoomEngine, { TUIRoomEvents, TUIRequestAction, TUIRequest, TUIRequestCallbackType } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from './useRoomEngine';
import { ElMessage } from 'element-plus';
import { MESSAGE_DURATION } from '../constants/message';
import { useRoomStore, UserInfo } from '../stores/room';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

const roomEngine = useGetRoomEngine();

export default function () {
  const roomStore = useRoomStore();
  const { applyToAnchorList } = storeToRefs(roomStore);
  const { t } = useI18n();

  // ------ 以下处理普通用户操作 ---------

  // new: 收到来自用户的上麦申请
  function onRequestReceived(eventInfo: { request: TUIRequest }) {
    const { requestAction, requestId, userId } = eventInfo.request;
    if (requestAction === TUIRequestAction.kRequestToTakeSeat) {
      // 用户申请上麦
      userId && roomStore.addApplyToAnchorUser({ userId, requestId });
    }
  }

  // 远端用户取消上麦申请
  function onRequestCancelled(eventInfo: { requestId: number, userId: string }) {
    const { userId } = eventInfo;
    roomStore.removeApplyToAnchorUser(userId);
  }

  // 处理用户请求
  async function handleUserApply(applyUserId: string, agree: boolean) {
    // TUIRoomCore.replySpeechApplication(applyUserId, agree);
    const userInfo = roomStore.remoteUserMap.get(applyUserId);
    if (userInfo) {
      const requestId = userInfo.applyToAnchorRequestId;
      requestId && await roomEngine.instance?.responseRemoteRequest({
        requestId,
        agree,
      });
    }
    roomStore.removeApplyToAnchorUser(applyUserId);
  }

  // 同意用户上台
  async function agreeUserOnStage(userInfo: UserInfo) {
    const requestId = userInfo.applyToAnchorRequestId;
    requestId && await roomEngine.instance?.responseRemoteRequest({
      requestId,
      agree: true,
    });
    roomStore.removeApplyToAnchorUser(userInfo.userId);
  }

  // 拒绝用户上台
  async function denyUserOnStage(userInfo: UserInfo) {
    const requestId = userInfo.applyToAnchorRequestId;
    requestId && await roomEngine.instance?.responseRemoteRequest({
      requestId,
      agree: false,
    });
    roomStore.removeApplyToAnchorUser(userInfo.userId);
  }

  // 拒绝全部用户上麦请求
  async function denyAllUserApply() {
    const applyUserList = applyToAnchorList.value.map(item => ({
      userId: item.userId,
      userName: item.userName,
      applyToAnchorRequestId: item.applyToAnchorRequestId,
    }));
    let index = 0;
    while (index >= 0 && index < applyUserList.length) {
      const { userId, userName, applyToAnchorRequestId } = applyUserList[index];
      try {
        applyToAnchorRequestId && await roomEngine.instance?.responseRemoteRequest({
          requestId: applyToAnchorRequestId,
          agree: false,
        });
        roomStore.removeApplyToAnchorUser(userId);
      } catch (error) {
        console.error(`拒绝 ${userName || userId} 上台申请失败，请重试！`);
        ElMessage({
          type: 'warning',
          message: t('Reject on Stage failed, please retry', { userName: userName || userId }),
          duration: MESSAGE_DURATION.NORMAL,
        });
      }
      index += 1;
    }
  }

  TUIRoomEngine.once('ready', () => {
    roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
    roomEngine.instance?.on(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
  });

  onBeforeUnmount(() => {
    roomEngine.instance?.off(TUIRoomEvents.onRequestReceived, onRequestReceived);
    roomEngine.instance?.off(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
  });

  // --------- 以下处理主持人主动操作 ----------

  // 邀请用户上台
  async function inviteUserOnStage(userInfo: UserInfo) {
    const { userId } = userInfo;
    const requestId = await roomEngine.instance?.requestRemoteUserOnSeat({
      seatIndex: -1,
      userId,
      timeout: 0,
      requestCallback: (callbackInfo: { requestCallbackType: TUIRequestCallbackType, userId: string }) => {
        const { requestCallbackType, userId } = callbackInfo;
        const userName = roomStore.getUserName(userId);
        switch (requestCallbackType) {
          case TUIRequestCallbackType.kRequestAccepted:
            ElMessage({
              type: 'success',
              message: `${userName || userId} ${t('accepted the invitation to the stage')}`,
              duration: MESSAGE_DURATION.NORMAL,
            });
            roomStore.removeInviteToAnchorUser(userId);
            break;
          case TUIRequestCallbackType.kRequestRejected:
            ElMessage({
              type: 'warning',
              message: `${userName || userId} ${t('declined the invitation to the stage')}`,
              duration: MESSAGE_DURATION.NORMAL,
            });
            roomStore.removeInviteToAnchorUser(userId);
            break;
          case TUIRequestCallbackType.kRequestTimeout:
            break;
          default:
            break;
        }
      },
    });
    requestId && roomStore.addInviteToAnchorUser({ userId, requestId });
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
    roomEngine.instance?.kickRemoteUserOffSeat({
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
    // 拒绝所有申请上麦用户
    denyAllUserApply,
    // 邀请用户上台
    inviteUserOnStage,
    // 取消邀请用户上台
    cancelInviteUserOnStage,
    // 将用户踢下麦
    kickUserOffStage,
  };
}
