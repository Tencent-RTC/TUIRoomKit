<template>
  <div class="manage-member-container">
    <div class="manage-member-header">
      <div class="search-container">
        <svg-icon :icon="SearchIcon" />
        <input
          v-model="searchText"
          class="search-input"
          :placeholder="t('Search Member')"
        />
      </div>
    </div>
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
      <svg-icon :icon="ApplyTipsIcon" class="apply-icon" />
      <div class="apply-info">{{ applyToAnchorUserContent }}</div>
      <div class="apply-check" @click="showApplyUserList">{{ t('Check') }}</div>
    </div>
    <div id="memberListContainer" class="member-list-container">
      <member-item
        v-for="userInfo in filteredUserStatusList"
        :key="userInfo.userId"
        :user-info="userInfo"
        :user-current-status="currentActiveTabName"
      />
    </div>
    <div
      v-if="!isGeneralUser && currentActiveTabName !== USERS_STATUS.NOT_ENTER"
      class="global-setting"
    >
      <tui-button
        class="button"
        size="default"
        @click="toggleManageAllMember(ManageControlType.AUDIO)"
      >
        {{ audioManageInfo }}
      </tui-button>
      <tui-button
        class="button"
        size="default"
        @click="toggleManageAllMember(ManageControlType.VIDEO)"
      >
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
        <div v-show="showMoreControl" :class="['tui-theme-white', 'drop-down']">
          <div
            v-for="item in moreControlList"
            :key="item.type"
            class="user-operate-item"
            @click="item.func(item.type)"
          >
            <svg-icon :icon="item.icon" />
            <span class="operate-text">{{ item.title }}</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="currentActiveTabName === USERS_STATUS.NOT_ENTER"
      class="global-setting"
    >
      <tui-button
        v-if="filteredUserStatusList.length > 0"
        class="button-bottom"
        size="default"
        @click="handleCallAllInvitee"
      >
        {{ t('Call all') }}
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
        <tui-button size="default" @click="doToggleManageAllMember">{{
          t('Confirm')
        }}</tui-button>
        <tui-button
          class="cancel-button"
          size="default"
          type="primary"
          @click="showManageAllUserDialog = false"
        >
          {{ t('Cancel') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import MemberItem from '../ManageMember/MemberItem';
import SvgIcon from '../common/base/SvgIcon.vue';
import SearchIcon from '../common/icons/SearchIcon.vue';
import ApplyTipsIcon from '../common/icons/ApplyTipsIcon.vue';
import Dialog from '../common/base/Dialog';
import { useRoomStore } from '../../stores/room';
import useIndex from './useIndexHooks';
import TuiButton from '../common/base/Button.vue';
import ArrowUpIcon from '../common/icons/ArrowUpIcon.vue';
import vClickOutside from '../../directives/vClickOutside';
import { USERS_STATUS } from '../../constants/room';

const roomStore = useRoomStore();

const { applyToAnchorList, isGeneralUser } = storeToRefs(roomStore);

const {
  t,
  searchText,
  showApplyUserList,
  showManageAllUserDialog,
  dialogTitle,
  dialogContent,
  toggleManageAllMember,
  doToggleManageAllMember,
  ManageControlType,
  handleToggleStaged,
  applyToAnchorUserContent,
  audioManageInfo,
  videoManageInfo,
  toggleClickMoreBtn,
  showMoreControl,
  moreControlList,
  userStatusList,
  currentActiveTabName,
  filteredUserStatusList,
  handleCallAllInvitee,
} = useIndex();

const handleShowMoreControl = () => {
  if (showMoreControl.value) {
    showMoreControl.value = false;
  }
};
</script>

<style lang="scss" scoped>
.more-container {
  position: relative;
  display: flex;

  .more-arrow {
    margin-left: 2px;

    &.down {
      transform: rotate(180deg);
    }
  }

  .drop-down {
    position: absolute;
    right: 3px;
    bottom: 40px;
    z-index: 1;
    padding: 8px 7px;
    background: var(--background-color-1);
    border-radius: 8px;
    box-shadow: var(--operation-box-shadow);

    .user-operate-item {
      display: flex;
      align-items: center;
      height: 20px;
      margin: 5px 7px;
      color: var(--operation-font-color);
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
}

.tui-theme-black .search-container {
  --background-color: rgba(79, 88, 107, 0.3);
  --font-color: #636a7e;
}

.tui-theme-white .search-container {
  --background-color: var(--background-color-3);
  --font-color: var(--font-color-1);
}

.tui-theme-black .more-container {
  --operation-font-color: #6b758a;
  --operation-box-shadow: 0px 3px 8px rgba(34, 38, 46, 0.3),
    0px 6px 40px rgba(34, 38, 46, 0.3);
}

.tui-theme-white .more-container {
  --operation-font-color: #6b758a;
  --operation-box-shadow: 0px 3px 8px #e9f0fb, 0px 6px 40px rgba(0, 0, 0, 0.1);
}

.manage-member-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  .manage-member-header {
    display: flex;
    justify-content: space-around;
    padding: 23px 20px 0;

    .search-container {
      display: flex;
      flex: 1;
      align-items: center;
      height: 32px;
      padding: 0 16px;
      color: var(--font-color-1);
      background-color: var(--background-color);
      border-radius: 16px;

      .search-input {
        width: 100%;
        margin-left: 8px;
        font-size: 14px;
        color: var(--font-color-1);
        background: none;
        border: none;
        outline: none;
      }
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

  .apply-on-stage-info {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 60px;
    padding: 0 20px 0 32px;
    background-color: var(--background-color-8);

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

    &::after {
      position: absolute;
      bottom: 0;
      left: 5%;
      width: 90%;
      height: 1px;
      content: '';
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
    cursor: pointer;
  }

  .button-bottom {
    width: 80%;
  }
}

.cancel-button {
  margin-left: 12px;
}
</style>
