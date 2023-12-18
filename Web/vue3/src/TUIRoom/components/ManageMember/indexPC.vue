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
    <div v-if="applyToAnchorList.length > 0" class="apply-on-stage-info">
      <div class="apply-info">
        {{ `${applyToAnchorList[0].userName || applyToAnchorList[0].userId} ${t('Applying for the stage')}` }}
      </div>
      <div class="button" @click="showApplyUserLit">{{ t('Check') }}</div>
    </div>
    <div id="memberListContainer" class="member-list-container">
      <member-item v-for="(userInfo) in showUserList" :key="userInfo.userId" :user-info="userInfo"></member-item>
    </div>
    <div v-if="isMaster" class="global-setting">
      <tui-button class="button" size="default" @click="toggleAllAudio">
        {{ isMicrophoneDisableForAllUser ? t('Enable all audios') : t('Disable all audios') }}
      </tui-button>
      <tui-button class="button" size="default" @click="toggleAllVideo">
        {{ isCameraDisableForAllUser ? t('Enable all videos') : t('Disable all videos') }}
      </tui-button>
    </div>
  </div>
</template>

<script setup lang='ts'>
import MemberItem from '../ManageMember/MemberItem';
import SvgIcon from '../common/base/SvgIcon.vue';
import SearchIcon from '../common/icons/SearchIcon.vue';
import InviteSolidIcon from '../common/icons/InviteSolidIcon.vue';
import { storeToRefs } from 'pinia';
import { useRoomStore } from '../../stores/room';
import useIndex from './useIndexHooks';
import TuiButton from '../common/base/Button.vue';

const roomStore = useRoomStore();

const {
  applyToAnchorList,
  isMicrophoneDisableForAllUser,
  isCameraDisableForAllUser,
  isMaster,
} = storeToRefs(roomStore);

const {
  t,
  searchText,
  showUserList,
  handleInvite,
  showApplyUserLit,
  toggleAllAudio,
  toggleAllVideo,
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
    .apply-on-stage-info {
      width: 100%;
      height: 60px;
      margin-top: 14px;
      background-image: linear-gradient(235deg, #1883FF 0%, #0062F5 100%);
      padding: 0 20px 0 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
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
        cursor: pointer;
      }
    }
  .member-list-container {
    overflow-y: scroll;
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
</style>
