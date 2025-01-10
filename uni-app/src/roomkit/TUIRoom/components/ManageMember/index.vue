<template>
  <div class="manage-member-container">
    <div class="manage-member-header">
      <div v-if="roomStore.isSpeakAfterTakingSeatMode" class="apply-count" @click="handleToggleStaged">
        <div :class="['apply-staged', {'apply-count-active': isOnStateTabActive }]">
          <text class="staged-text">{{ alreadyStaged }}</text>
        </div>
        <div :class="['apply-not-stage', { 'apply-count-active': !isOnStateTabActive }]">
          <text class="staged-text">{{ notStaged }}</text>
        </div>
      </div>
      <div v-if="applyToAnchorList.length > 0 && !isGeneralUser" class="apply-on-stage-info">
        <svg-icon style="display: flex" icon="ApplyTipsIcon" color="#B2BBD1"></svg-icon>
        <text class="apply-info"> {{ applyToAnchorUserContent }} </text>
        <text class="apply-check" @click="showApplyUserList">{{ t('Check') }}</text>
      </div>
    </div>
    <div class="member-list-container">
      <div class="member-list-header">
        <text class="member-list"> {{ t('Member List') }} </text>
        <text class="member-count">({{ userNumber }}{{ t('members') }})</text>
      </div>
      <div class="member-list-content">
        <scroll-view class="scroll-view" scroll-y="true">
          <member-item v-for="(userInfo) in filteredUserList" :key="userInfo.userId" :user-info="userInfo"></member-item>
        </scroll-view>
      </div>
    </div>
    <div v-if="!isGeneralUser" class="manage-member-bottom">
      <div
        class="manage-member-button"
        :class="isMicrophoneDisableForAllUser ? 'lift-all' : ''"
        @touchstart="toggleManageAllMember(ManageControlType.AUDIO)"
      >
        <text class="manage-member-text">{{ audioManageInfo }}</text>
      </div>
      <div
        class="manage-member-button"
        :class="isCameraDisableForAllUser ? 'lift-all' : ''"
        @touchstart="toggleManageAllMember(ManageControlType.VIDEO)"
      >
        <text class="manage-member-text">{{ videoManageInfo }}</text>
      </div>
    </div>
    <Dialog
      v-model="showManageAllUserDialog"
      :title="dialogTitle"
      width="480px"
      :modal="true"
      :append-to-room-container="true"
      :confirm-button="t('Confirm')"
      :cancel-button="t('Cancel')"
      @confirm="doToggleManageAllMember"
      @cancel="showManageAllUserDialog = false"
    >
      {{ dialogContent }}
    </Dialog>
  </div>
</template>

<script setup lang='ts'>
import MemberItem from '../ManageMember/MemberItem/index.vue';
import Dialog from '../common/base/Dialog/index.vue';
import useIndex from './useIndexHooks';
import { storeToRefs } from 'pinia';
import { useRoomStore } from '../../stores/room';
import SvgIcon from '../common/base/SvgIcon.vue';
const roomStore = useRoomStore();
const {
  userNumber,
  applyToAnchorList,
  isMicrophoneDisableForAllUser,
  isCameraDisableForAllUser,
  isGeneralUser,
} = storeToRefs(roomStore);

const {
  audioManageInfo,
  videoManageInfo,
  showManageAllUserDialog,
  dialogTitle,
  dialogContent,
  ManageControlType,
  toggleManageAllMember,
  doToggleManageAllMember,
  t,
  alreadyStaged,
  notStaged,
  filteredUserList,
  isOnStateTabActive,
  handleToggleStaged,
  applyToAnchorUserContent,
  showApplyUserList,
} = useIndex();

</script>

<style lang="scss" scoped>
.manage-member-container {
  position: relative;
  width: 750rpx;
  height: 1440rpx;
  display: flex;
  flex-direction: column;
  .manage-member-header {
    .apply-count {
      height: 36px;
      border-radius: 10px;
      margin: 16px 16px 8px 16px;
      background-color: #F0F3FA;
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      flex: 1;
      padding: 3px 4px;
      .apply-staged,
      .apply-not-stage {
        flex: 1;
        border-radius: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        text-align: center;
        .staged-text {
          color: #4F586B;
          font-size: 14px;
          font-weight: 400;
        }
      }
      .apply-not-stage {
        // top: 50%;
        // left: 50%;
        // height: 30px;
        // transform: translateY(-50%);
      }
      .apply-count-active {
        background-color: #FFFFFF;
      }
    }
    .apply-on-stage-info {
      height: 40px;
      padding: 0 20px 0 26px;
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-direction: row;
      .apply-info {
        font-weight: 400;
        font-size: 14px;
        color: #4F586B;
        padding-left: 4px;
        flex: 1;
      }
      .apply-check {
        text-align: center;
        line-height: 32px;
        font-weight: 400;
        font-size: 14px;
        color: #1C66E5;
      }
    }
    .apply-info {
      font-weight: 400;
      font-size: 14px;
      color: #FFFFFF;
    }
    .button {
      width: 82px;
      height: 32px;
      background: rgba(255,255,255,0.10);
      border: 1px solid #FFFFFF;
      border-radius: 2px;
      text-align: center;
      line-height: 32px;
      font-weight: 400;
      font-size: 14px;
      color: #FFFFFF;
    }
  }
  .member-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    .member-list{
      font-weight: 500;
      font-size: 14px;
      color: #000000;
      line-height: 24px;
    }
    .member-count {
      font-weight: 500;
      font-size: 14px;
      color: #000000;
      line-height: 24px;
      display: flex;
      flex-direction: row;
      margin-left: 5px;
    }
    .member-list-header {
      padding: 0 32px;
      margin-bottom: 8px;
      display: flex;
      flex-direction: row;
    }
    .member-list-content {
      display: flex;
      flex-direction: row;
      flex: 1;
      .scroll-view {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
    }
  }
  .manage-member-bottom {
    display: flex;
    justify-content: space-around;
    flex-direction: row;
    margin-bottom: 40px;
    margin-top: 10px;
    .manage-member-button {
      border-radius: 10px;
      padding: 13px 24px;
      background-color: #006EFF;
      .manage-member-text {
        font-weight: 400;
        color: #FFFFFF;
      }
    }
    .lift-all {
      color: #FFFFFF;
    }
  }
  .popup-dialog-audio,.popup-dialog-video {
    width: 64vw;
    background: #ececed;
    border-radius: 8px;
    position: absolute;
    bottom: 46vh;
    left: 18vw;
    .popup-dialog-audio-title {
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 400;
      font-size: 16px;
      line-height: 22px;
      text-align: center;
      color: #2B2E38;
      padding: 20px;
    }
    .popup-button{
      display: flex;
      padding: 10px;
      .popup-button-cancel{
        padding: 4px 16px;
        background-color: #fff;
        color: #646366;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
      }
      .popup-button-mute{
        padding: 4px 16px;
        background-color: #006eff;
        color: #fff;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
      }
    }
  }
}
.agree, .cancel{
  padding: 14px;
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1C66E5;
  font-size: 16px;
  font-weight: 500;
}
.cancel{
  color: #4F586B;
}
</style>
