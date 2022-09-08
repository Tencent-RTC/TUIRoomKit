// 举手发言逻辑
// 主持人：同意/拒绝用户的申请发言，踢人下麦，邀请用户上麦，取消邀请用户上麦

import { onMounted, onBeforeUnmount } from 'vue';
import TUIRoomCore, { ETUIRoomEvents, ETUISignalStatus } from '../tui-room-core';
import { ElMessage } from 'element-plus';
import { MESSAGE_DURATION } from '../constants/message';
import { useRoomStore, UserInfo } from '../stores/room';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';


export default function () {
  const roomStore = useRoomStore();
  const { applyToAnchorList } = storeToRefs(roomStore);
  const { t } = useI18n();

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
  async function denyAllUserApply() {
    const applyUserList = applyToAnchorList.value.map(item => ({ userId: item.userId, userName: item.userName }));
    let index = 0;
    while (index >= 0 && index < applyUserList.length) {
      const { userId, userName } = applyUserList[index];
      try {
        await TUIRoomCore.replySpeechApplication(userId, false);
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
        ElMessage({
          type: 'success',
          message: `${userName || userId} ${t('accepted the invitation to the stage')}`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        roomStore.removeInviteToAnchorUser(userId);
        break;
      case ETUISignalStatus.REJECTED:
        ElMessage({
          type: 'warning',
          message: `${userName || userId} ${t('declined the invitation to the stage')}`,
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
