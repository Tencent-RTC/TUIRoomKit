<template>
  <div class="manage-member-container">
    <div class="manage-member-header">
      <div class="search-container">
        <svg-icon :icon="SearchIcon"></svg-icon>
        <input v-model="searchText" class="search-input" :placeholder="t('Search Member')">
      </div>
      <tui-button class="invite-button" type="primary" @click="handleInvite">
        <template #icon>
          <invite-solid-icon></invite-solid-icon>
        </template>
        <span class="invite-content">{{ t('Invite') }}</span>
      </tui-button>
    </div>
    <div
      v-if="roomStore.isSpeakAfterTakingSeatMode"
      class="apply-count"
      @click="handleToggleStaged"
    >
      <span :class="['apply-staged', {'apply-count-active': isOnStateTabActive }]">{{ alreadyStaged }}</span>
      <span :class="['apply-not-stage', { 'apply-count-active': !isOnStateTabActive }]">{{ notStaged }}</span>
    </div>
    <div v-if="applyToAnchorList.length > 0 && !isGeneralUser" class="apply-on-stage-info">
      <svg-icon :icon="ApplyTipsIcon" class="apply-icon"></svg-icon>
      <div class="apply-info"> {{ applyToAnchorUserContent }} </div>
      <div class="apply-check" @click="showApplyUserList">{{ t('Check') }}</div>
    </div>
    <div id="memberListContainer" class="member-list-container">
      <member-item v-for="(userInfo) in filteredUserList" :key="userInfo.userId" :user-info="userInfo"></member-item>
    </div>
    <div v-if="!isGeneralUser" class="global-setting">
      <tui-button class="button" size="default" @click="toggleManageAllMember(ManageControlType.AUDIO)">
        {{ isMicrophoneDisableForAllUser ? t('Enable all audios') : t('Disable all audios') }}
      </tui-button>
      <tui-button class="button" size="default" @click="toggleManageAllMember(ManageControlType.VIDEO)">
        {{ isCameraDisableForAllUser ? t('Enable all videos') : t('Disable all videos') }}
      </tui-button>
    </div>
    <Dialog
      v-model="showManageAllUserDialog"
      :title="dialogTitle"
      width="480px"
      :modal="true"
      :append-to-room-container="true"
    >
      <span>
        {{ dialogContent }}
      </span>
      <template #footer>
        <tui-button size="default" @click="doToggleManageAllMember">{{ t('Confirm') }}</tui-button>
        <tui-button class="cancel-button" size="default" type="primary" @click="showManageAllUserDialog = false">
          {{ t('Cancel') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang='ts'>
import { storeToRefs } from 'pinia';
import MemberItem from '../ManageMember/MemberItem/index.vue';
import SvgIcon from '../common/base/SvgIcon.vue';
import SearchIcon from '../common/icons/SearchIcon.vue';
import ApplyTipsIcon from '../common/icons/ApplyTipsIcon.vue';
import InviteSolidIcon from '../common/icons/InviteSolidIcon.vue';
import Dialog from '../common/base/Dialog/index.vue';
import { useRoomStore } from '../../stores/room';
import useIndex from './useIndexHooks';
import TuiButton from '../common/base/Button.vue';

const roomStore = useRoomStore();

const {
  applyToAnchorList,
  isMicrophoneDisableForAllUser,
  isCameraDisableForAllUser,
  isGeneralUser,
} = storeToRefs(roomStore);

const {
  t,
  searchText,
  handleInvite,
  showApplyUserList,
  showManageAllUserDialog,
  dialogTitle,
  dialogContent,
  toggleManageAllMember,
  doToggleManageAllMember,
  ManageControlType,
  alreadyStaged,
  notStaged,
  filteredUserList,
  isOnStateTabActive,
  handleToggleStaged,
  applyToAnchorUserContent,
} = useIndex();

</script>

<style lang="scss" scoped>

.tui-theme-black .search-container {
  --background-color: rgba(79, 88, 107, 0.30);
  --font-color: #636A7E;
}
.tui-theme-white .search-container {
  --background-color: var(--background-color-3);
  --font-color: var(--font-color-1);
}

  .manage-member-container {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;

    .manage-member-header {
      padding: 23px 20px 0 20px;
      display: flex;
      justify-content: space-around;
      .search-container {
        height: 32px;
        border-radius: 16px;
        padding: 0 16px;
        background-color: var(--background-color);
        color: var(--font-color-1);
        display: flex;
        align-items: center;
        flex: 1;
        .search-input {
          margin-left: 8px;
          font-size: 14px;
          outline: none;
          border: none;
          background: none;
          width: 100%;
          color: var(--font-color-1);
        }
      }
      .invite-button {
        width: 85px;
        height: 32px;
        margin-left: 10px;
        line-height: 16px;
        .invite-content {
          margin-left: 3px;
        }
      }
    }
    .apply-count {
      height: 36px;
      border-radius: 20px;
      margin: 16px 20px 0 20px;
      background-color: var(--background-color-11);
      position: relative;
      display: flex;
      cursor: pointer;
      .apply-staged,
      .apply-not-stage {
        position: absolute;
        left: 0;
        top: 3px;
        width: 50%;
        height: 80%;
        filter: drop-shadow(0px 2px 4px rgba(32, 77, 141, 0.03)) drop-shadow(0px 6px 10px rgba(32, 77, 141, 0.06))
                drop-shadow(0px 3px 14px rgba(32, 77, 141, 0.05));
        border-radius: 20px;
        transform: translateX(4px);
        display: flex;
        justify-content: center;
        align-content: center;
        flex-wrap: wrap;
        color: var(--font-color-1);
        font-size: 14px;
        font-weight: 400;
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
    .apply-on-stage-info {
      width: 100%;
      height: 60px;
      background-color: var(--background-color-8);
      padding: 0 20px 0 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      .apply-icon {
        color: var(--font-color-2);
      }
      .apply-info {
        font-weight: 400;
        font-size: 14px;
        color: var(--font-color-8);
        padding-left: 4px;
        flex: 1;
      }
      .apply-check {
        text-align: center;
        line-height: 32px;
        font-weight: 400;
        font-size: 14px;
        color: var(--active-color-2);
        cursor: pointer;
      }
      &::after {
        content: "";
        position: absolute;
        left: 5%;
        bottom: 0;
        width: 90%;
        height: 1px;
        background-color: var(--stroke-color-2);
      }
    }
  .member-list-container {
    flex: 1;
    margin-top: 10px;
    overflow-y: scroll;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  .global-setting {
    display: flex;
    justify-content: space-around;
    margin: 20px;
  }
}
.cancel-button {
  margin-left: 12px;
}
</style>
