<template>
  <div
    v-if="!isGeneralUser && activeCategoryKey !== 'notEnteredUser'"
    class="manage-member-bottom"
  >
    <div
      class="manage-member-button"
      :class="isMicrophoneDisableForAllUser ? 'lift-all' : ''"
      @touchstart="roomAudioAction.handler"
    >
      {{ roomAudioAction.label }}
    </div>
    <div
      class="manage-member-button"
      :class="isCameraDisableForAllUser ? 'lift-all' : ''"
      @touchstart="roomVideoAction.handler"
    >
      {{ roomVideoAction.label }}
    </div>
    <div class="manage-member-button" @touchstart="toggleClickMoreBtn">
      {{ t('More') }}
      <div v-show="showMoreControl" class="more-control-container">
        <div class="more-control-container-main">
          <div
            v-for="item in moreControlList"
            :key="item.key"
            class="user-operate-item"
            @touchstart="item.handler"
          >
            <TUIIcon :icon="item.icon" />
            <span class="operate-text">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="activeCategoryKey === 'notEnteredUser'" class="global-setting">
    <div
      v-if="userCategoryNumber > 0"
      class="button-bottom"
      @click="handleCallAllInvitee"
    >
      {{ t('Call all') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import useIndex from './useIndexHooks';
import { TUIIcon } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomStore } from '../../../../stores/room';
import { storeToRefs } from 'pinia';

interface Props {
  activeCategoryKey: string;
  userCategoryNumber: number;
}

defineProps<Props>();

const roomStore = useRoomStore();
const { isMicrophoneDisableForAllUser, isCameraDisableForAllUser } =
  storeToRefs(roomStore);

const {
  t,
  isGeneralUser,
  roomAudioAction,
  roomVideoAction,
  moreControlList,
  toggleClickMoreBtn,
  showMoreControl,
  handleCallAllInvitee,
} = useIndex();
</script>

<style lang="scss" scoped>
.manage-member-bottom {
  z-index: 1;
  display: flex;
  justify-content: space-around;
  width: 100%;

  .manage-member-button {
    padding: 13px 24px;
    font-weight: 400;
    color: var(--text-color-primary);
    background-color: var(--bg-color-function);
    border-radius: 10px;
  }

  .lift-all {
    color: var(--text-color-error);
  }
}

.more-control-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  width: 100vw;
  height: auto;
  background-color: var(--uikit-color-black-8);

  .more-control-container-main {
    position: fixed;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
    padding: 50px 25px;
    padding-bottom: 4vh;
    background-color: var(--bg-color-operate);
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
    color: var(--text-color-primary);
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

.global-setting {
  display: flex;
  justify-content: space-around;
}

.button-bottom {
  display: flex;
  justify-content: center;
  width: 80%;
  padding: 13px 24px;
  font-weight: 400;
  color: var(--text-color-secondary);
  background-color: var(--bg-color-operate);
  border-radius: 10px;
}
</style>
