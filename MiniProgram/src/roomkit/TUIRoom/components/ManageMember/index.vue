<template>
  <div class="manage-member-container">
    <div class="manage-member-header">
      <div class="apply-count">
        <div class="user-status">
          <div
            :class="[
              'user-status-container',
              {
                'apply-count-active': item.status === currentActiveTabName,
              },
            ]"
            v-for="(item, index) in userStatusList"
            :key="index"
            @click="handleToggleStaged(item)"
          >
            <span class="apply-staged">{{ item.title }} </span>
          </div>
        </div>
      </div>
      <div
        v-if="applyToAnchorList.length > 0 && !isGeneralUser"
        class="apply-on-stage-info"
      >
        <svg-icon
          style="display: flex"
          :icon="ApplyTipsIcon"
          class="apply-icon"
        />
        <div class="apply-info">{{ applyToAnchorUserContent }}</div>
        <div class="apply-check" @click="showApplyUserList">
          {{ t('Check') }}
        </div>
      </div>
    </div>
    <div class="member-list-container">
      <div class="member-list-container">
        <member-item
          v-for="userInfo in filteredUserStatusList"
          :key="userInfo.userId"
          :user-info="userInfo"
          :user-current-status="currentActiveTabName"
        />
      </div>
    </div>
    <div
      v-if="!isGeneralUser && currentActiveTabName !== USERS_STATUS.NOT_ENTER"
      class="manage-member-bottom"
    >
      <div
        class="manage-member-button"
        :class="isMicrophoneDisableForAllUser ? 'lift-all' : ''"
        @touchstart="toggleManageAllMember(ManageControlType.AUDIO)"
      >
        {{ audioManageInfo }}
      </div>
      <div
        class="manage-member-button"
        :class="isCameraDisableForAllUser ? 'lift-all' : ''"
        @touchstart="toggleManageAllMember(ManageControlType.VIDEO)"
      >
        {{ videoManageInfo }}
      </div>
      <div class="manage-member-button" @touchstart="toggleClickMoreBtn">
        {{ t('More') }}
        <div v-show="showMoreControl" class="more-control-container">
          <div class="more-control-container-main">
            <div
              v-for="item in moreControlList"
              :key="item.type"
              class="user-operate-item"
              @touchstart="item.func(item.type)"
            >
              <svg-icon style="display: flex" :icon="item.icon" />
              <span class="operate-text">{{ item.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="currentActiveTabName === USERS_STATUS.NOT_ENTER"
      class="global-setting"
    >
      <div
        v-if="filteredUserStatusList.length > 0"
        class="button-bottom"
        @click="handleCallAllInvitee"
      >
        {{ t('Call all') }}
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
      <span>
        {{ dialogContent }}
      </span>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import MemberItem from '../ManageMember/MemberItem/index.vue';
import Dialog from '../common/base/Dialog/index.vue';
import useIndex from './useIndexHooks';
import { storeToRefs } from 'pinia';
import { useRoomStore } from '../../stores/room';
import SvgIcon from '../common/base/SvgIcon.vue';
import ApplyTipsIcon from '../../assets/icons/ApplyTipsIcon.svg';
import { USERS_STATUS } from '../../constants/room';

const roomStore = useRoomStore();
const {
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
  handleToggleStaged,
  applyToAnchorUserContent,
  showApplyUserList,
  showMoreControl,
  moreControlList,
  toggleClickMoreBtn,
  userStatusList,
  currentActiveTabName,
  filteredUserStatusList,
  handleCallAllInvitee,
} = useIndex();
</script>

<style lang="scss" scoped>
.apply-info {
  font-size: 14px;
  font-weight: 400;
  color: #fff;
}

.manage-member-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  .manage-member-header {
    .apply-on-stage-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 40px;
      padding: 0 20px 0 26px;

      .apply-icon {
        color: var(--font-color-2);
      }

      .apply-info {
        flex: 1;
        padding-left: 4px;
        font-size: 14px;
        font-weight: 400;
        color: var(--font-color-8);
      }

      .apply-check {
        font-size: 14px;
        font-weight: 400;
        line-height: 32px;
        color: var(--active-color-2);
        text-align: center;
        cursor: pointer;
      }
    }

    .button {
      width: 82px;
      height: 32px;
      font-size: 14px;
      font-weight: 400;
      line-height: 32px;
      color: #fff;
      text-align: center;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid #fff;
      border-radius: 2px;
    }
  }

  .apply-count {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
    margin: 16px 20px 0;
    cursor: pointer;
    background-color: var(--background-color-11);
    border-radius: 20px;

    .user-status {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 80%;
      padding: 0 5px;
    }

    .user-status-container {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      height: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      border-radius: 20px;
    }

    .apply-staged,
    .apply-not-stage {
      font-size: 14px;
      font-weight: 400;
      color: var(--font-color-1);
      filter: drop-shadow(0 2px 4px rgba(32, 77, 141, 0.03))
        drop-shadow(0 6px 10px rgba(32, 77, 141, 0.06))
        drop-shadow(0 3px 14px rgba(32, 77, 141, 0.05));
      border-radius: 20px;
      transform: translateX(4px);
    }

    .apply-not-stage {
      top: 50%;
      left: 50%;
      width: 176px;
      height: 30px;
      transform: translateY(-50%);
    }

    .apply-count-active {
      background-color: var(--background-color-12);
    }
  }

  .global-setting {
    display: flex;
    justify-content: space-around;
  }

  .button-bottom {
    width: 80%;
    display: flex;
    justify-content: center;
    padding: 13px 24px;
    font-weight: 400;
    color: var(--mute-button-color-h5);
    background-color: var(--manage-member-button-h5);
    border-radius: 10px;
  }

  .member-list-container {
    flex: 1;
    min-height: 0;
    overflow-y: scroll;

    .member-count {
      margin-left: 5px;
    }

    &::-webkit-scrollbar {
      display: none;
    }

    .member-list-header {
      padding: 0 32px;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      line-height: 24px;
      color: var(--input-font-color);
    }

    .member-list-content {
      flex: 1;
      overflow-y: scroll;
    }
  }

  .manage-member-bottom {
    z-index: 1;
    display: flex;
    justify-content: space-around;
    width: 100%;

    .manage-member-button {
      padding: 13px 24px;
      font-weight: 400;
      color: var(--mute-button-color-h5);
      background-color: var(--manage-member-button-h5);
      border-radius: 10px;
    }

    .lift-all {
      color: var(--mute-all-h5);
    }
  }

  .popup-dialog-audio,
  .popup-dialog-video {
    position: absolute;
    bottom: 46vh;
    left: 18vw;
    width: 64vw;
    white-space: nowrap;
    background: var(--popup-mute-background-color-h5);
    border-radius: 8px;

    .popup-dialog-audio-title {
      padding: 20px;
      font-family: 'PingFang SC';
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
      color: #2b2e38;
      text-align: center;
      white-space: normal;
    }

    .popup-button {
      display: flex;
      justify-content: space-evenly;
      padding: 10px;

      .popup-button-cancel {
        padding: 4px 16px;
        color: #646366;
        background-color: #fff;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
      }

      .popup-button-mute {
        padding: 4px 16px;
        color: #fff;
        background-color: #006eff;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
      }
    }
  }
}

.agree,
.cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50%;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  color: var(--active-color-1);
}

.cancel {
  color: var(--font-color-4);
}

.more-control-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  width: 100vw;
  height: auto;
  background-color: var(--log-out-mobile);

  .more-control-container-main {
    position: fixed;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
    padding: 50px 25px;
    padding-bottom: 4vh;
    background: var(--background-color-1);
    border-radius: 15px 15px 0 0;
    animation-name: popup;
    animation-duration: 200ms;

    @keyframes popup {
      from {
        transform: scaleY(0);
        transform-origin: bottom;
      }

      to {
        transform: scaleY(1);
        transform-origin: bottom;
      }
    }
  }

  .user-operate-item {
    display: flex;
    align-items: center;
    height: 20px;
    color: var(--popup-title-color-h5);
    cursor: pointer;

    .operate-text {
      margin-left: 8px;
      font-family: 'PingFang SC';
      font-size: 14px;
      font-weight: 400;
      line-height: 22px;
      white-space: nowrap;
    }
  }
}
</style>
