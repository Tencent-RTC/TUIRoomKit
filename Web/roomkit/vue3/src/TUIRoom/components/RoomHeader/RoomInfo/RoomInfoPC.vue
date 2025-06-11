<template>
  <div class="conference-container">
    <div v-if="isShowRoomInfoTitle">
      <div class="title-container" @click.stop="toggleShowRoomInfoStatus">
        <span class="text">{{ conferenceTitle }}</span>
        <IconArrowUp
          size="12"
          :class="['arrow-icon', { 'arrow-down-icon': arrowDirection }]"
        />
        <room-time class="room-timing" />
      </div>
    </div>
    <div
      v-if="isShowRoomInfo"
      v-click-outside="handleClickOutsideRoomInfoContainer"
      class="roomInfo-container"
    >
      <div
        v-for="item in roomInfoTabList"
        v-show="item.visible"
        :key="item.id"
        class="roomInfo-content"
      >
        <span class="roomInfo-title">{{ t(item.title) }}</span>
        <span class="roomInfo-item">{{ item.content }}</span>
        <div
          v-if="item.isShowCopyIcon"
          class="copy-container"
          @click="onCopy(item.copyLink)"
        >
          <IconCopy />
          <span>{{ t('Copy') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { IconArrowUp, IconCopy } from '@tencentcloud/uikit-base-component-vue3';
import useRoomInfo from './useRoomInfoHooks';
import vClickOutside from '../../../directives/vClickOutside';
import RoomTime from '../../common/RoomTime.vue';

const {
  t,
  arrowDirection,
  isShowRoomInfoTitle,
  conferenceTitle,
  isShowRoomInfo,
  roomInfoTabList,
  toggleShowRoomInfoStatus,
  handleClickOutsideRoomInfoContainer,
  onCopy,
} = useRoomInfo();
</script>

<style lang="scss" scoped>
.conference-container {
  position: relative;
  min-width: 140px;
}

.title-container {
  display: flex;
  align-items: center;
  padding: 20px 0;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  cursor: pointer;
}

.arrow-icon {
  display: flex;
  align-items: center;
  width: 16px;
  height: 16px;
  margin-left: 5px;
  background-size: cover;
  transform: rotateX(180deg);
}

.arrow-down-icon {
  transform: rotateX(0);
}

.room-timing {
  padding-left: 12px;
}

.roomInfo-container {
  position: absolute;
  top: calc(100% - 12px);
  left: 50%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background-color: var(--bg-color-dialog);
  box-shadow:
    0 2px 6px var(--uikit-color-black-8),
    0 8px 18px var(--uikit-color-black-8);
  border-radius: 16px;
  transform: translateX(-50%);

  .roomInfo-content {
    display: flex;
    align-items: stretch;
    min-width: 300px;
    font-size: 14px;
    font-weight: 400;
    line-height: normal;
    letter-spacing: -0.24px;

    .roomInfo-title {
      flex-basis: 30%;
      color: var(--text-color-secondary);
    }

    .roomInfo-item {
      flex-basis: 50%;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text-color-primary);
    }

    .copy-container {
      display: flex;
      margin-left: auto;
      cursor: pointer;
      color: var(--text-color-link);
    }
  }
}
</style>
