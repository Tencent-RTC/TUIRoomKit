// 举手发言逻辑
// 主持人：同意/拒绝用户的申请发言，踢人下麦，邀请用户上麦，取消邀请用户上麦

import { onMounted, onBeforeUnmount } from 'vue';
import TUIRoomCore, { ETUIRoomEvents, ETUISignalStatus } from '../tui-room-core';
import { Message } from 'element-ui';
import { MESSAGE_DURATION } from '../constants/message';
import { useRoomStore, UserInfo } from '../stores/room';
import { storeToRefs } from 'pinia';

export default function () {
  const roomStore = useRoomStore();
  const { applyToAnchorList } = storeToRefs(roomStore);

  // ------ 以下处理普通用户操作 ---------

  // 收到来自用户的上麦申请
  async function onReceiveSpeechApplication(data: { userId: string }) {
    const { userId: applyUserId } = data;
    applyUserId && roomStore.addApplyToAnchorUser(applyUserId);
  }

  // 远端用户取消上麦申请
  function onSpeechApplicationCancelled(data: { userId: string }) {
    const { userId: applyUserId } = data;
    roomStore.removeApplyToAnchorUser(applyUserId);
  }

  // 处理用户请求
  function handleUserApply(applyUserId: string, agree: boolean) {
    TUIRoomCore.replySpeechApplication(applyUserId, agree);
    roomStore.removeApplyToAnchorUser(applyUserId);
  }

  // 同意用户上台
  function agreeUserOnStage(userInfo: UserInfo) {
    const { userId: applyUserId } = userInfo;
    TUIRoomCore.replySpeechApplication(applyUserId, true);
    roomStore.removeApplyToAnchorUser(applyUserId);
  }

  // 拒绝用户上台
  function denyUserOnStage(userInfo: UserInfo) {
    const { userId: applyUserId } = userInfo;
    TUIRoomCore.replySpeechApplication(applyUserId, false);
    roomStore.removeApplyToAnchorUser(applyUserId);
  }

  // 拒绝全部用户上麦请求
  function denyAllUserApply() {
    applyToAnchorList.value.forEach((item) => {
      TUIRoomCore.replySpeechApplication(item.userId, false);
      roomStore.removeApplyToAnchorUser(item.userId);
    });
  }

  onMounted(() => {
    TUIRoomCore.on(ETUIRoomEvents.onReceiveSpeechApplication, onReceiveSpeechApplication);
    TUIRoomCore.on(ETUIRoomEvents.onSpeechApplicationCancelled, onSpeechApplicationCancelled);
  });

  onBeforeUnmount(() => {
    TUIRoomCore.off(ETUIRoomEvents.onReceiveSpeechApplication, onReceiveSpeechApplication);
    TUIRoomCore.off(ETUIRoomEvents.onSpeechApplicationCancelled, onSpeechApplicationCancelled);
  });

  // --------- 以下处理主持人主动操作 ----------

  // 邀请用户上台
  async function inviteUserOnStage(userInfo: UserInfo) {
    const { userId, userName } = userInfo;
    const inviteResponse = await TUIRoomCore.sendSpeechInvitation(userId);
    switch (inviteResponse.code) {
      case ETUISignalStatus.ACCEPTED:
        Message({
          type: 'success',
          message: `${userName || userId} 接受了上台邀请`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        roomStore.removeInviteToAnchorUser(userId);
        break;
      case ETUISignalStatus.REJECTED:
        Message({
          type: 'warning',
          message: `${userName || userId} 拒绝了上台邀请`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        roomStore.removeInviteToAnchorUser(userId);
        break;
      case ETUISignalStatus.CANCELLED:
        break;
      default:
        break;
    }
  }

  // 取消邀请用户上台
  function cancelInviteUserOnStage(userInfo: UserInfo) {
    TUIRoomCore.cancelSpeechInvitation(userInfo.userId);
  }

  // 邀请下台
  function kickUserOffStage(userInfo: UserInfo) {
    TUIRoomCore.kickUserOffStage(userInfo.userId);
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
