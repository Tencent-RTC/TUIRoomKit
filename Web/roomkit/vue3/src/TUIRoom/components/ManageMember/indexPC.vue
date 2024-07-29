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
        {{ audioManageInfo }}
      </tui-button>
      <tui-button class="button" size="default" @click="toggleManageAllMember(ManageControlType.VIDEO)">
        {{ videoManageInfo }}
      </tui-button>
      <div class="more-container" v-click-outside="handleShowMoreControl">
        <tui-button class="button" size="default" @click="toggleClickMoreBtn">
          {{ t('More') }}
          <svg-icon
            size="12"
            :class="['more-arrow', showMoreControl ? 'up' : 'down']"
            :icon="ArrowUpIcon"
          />
        </tui-button>
        <div
          v-show="showMoreControl"
          :class="['tui-theme-white', 'drop-down']"
        >
          <div
            v-for="item in moreControlList"
            :key="item.type"
            class="user-operate-item"
            @click="item.func(item.type)"
          >
            <svg-icon :icon="item.icon"></svg-icon>
            <span class="operate-text">{{ item.title }}</span>
          </div>
        </div>
      </div>
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
import MemberItem from '../ManageMember/MemberItem';
import SvgIcon from '../common/base/SvgIcon.vue';
import SearchIcon from '../common/icons/SearchIcon.vue';
import ApplyTipsIcon from '../common/icons/ApplyTipsIcon.vue';
import InviteSolidIcon from '../common/icons/InviteSolidIcon.vue';
import Dialog from '../common/base/Dialog';
import { useRoomStore } from '../../stores/room';
import useIndex from './useIndexHooks';
import TuiButton from '../common/base/Button.vue';
import ArrowUpIcon from '../common/icons/ArrowUpIcon.vue';
import vClickOutside from '../../directives/vClickOutside';

const roomStore = useRoomStore();

const {
  applyToAnchorList,
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
  audioManageInfo,
  videoManageInfo,
  toggleClickMoreBtn,
  showMoreControl,
  moreControlList,
} = useIndex();

const handleShowMoreControl = () => {
  if(showMoreControl.value) {
    showMoreControl.value = false;
  }
}

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

.tui-theme-black .more-container {
  --operation-font-color: #6B758A;
  --operation-box-shadow: 0px 3px 8px rgba(34, 38, 46, 0.30), 0px 6px 40px rgba(34, 38, 46, 0.30);
}

.tui-theme-white .more-container {
  --operation-font-color: #6B758A;
  --operation-box-shadow: 0px 3px 8px #E9F0FB, 0px 6px 40px rgba(0, 0, 0, 0.10);
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
    margin: 20px 0;
  }
}
.cancel-button {
  margin-left: 12px;
}
.more-container{
  display: flex;
  position: relative;
  .more-arrow {
      margin-left: 2px;
      &.down {
        transform: rotate(180deg);
      }
    }
  .drop-down{
    position: absolute;
    bottom: 40px;
    background: var(--background-color-1);
    box-shadow: var(--operation-box-shadow);
    border-radius: 8px;
    z-index: 1;
    right: 3px;
    padding: 8px 7px;
    .user-operate-item {
      margin: 5px 7px;
      cursor: pointer;
      color: var(--operation-font-color);
      height: 20px;
      display: flex;
      align-items: center;
      .operate-text {
        font-family: PingFang SC;
        margin-left: 8px;
        font-size: 14px;
        white-space: nowrap;
        line-height: 22px;
        font-weight: 400;
      }
    }
  }
}
</style>
