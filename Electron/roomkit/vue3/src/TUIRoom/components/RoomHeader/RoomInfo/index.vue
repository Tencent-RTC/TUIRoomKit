<template>
  <div class="conference-container">
    <div v-if="isShowRoomInfoTitle">
      <div class="title-container" @click.stop="toggleShowRoomInfoStatus">
        <span class="text">{{ conferenceTitle }}</span>
        <svg-icon
          :class="['arrow-icon', { 'arrow-down-icon': arrowDirection }]"
          :icon="Arrow"
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
          <svg-icon class="copy" :icon="copyIcon" />
          <span>{{ t('Copy') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import useRoomInfo from './useRoomInfoHooks';
import SvgIcon from '../../common/base/SvgIcon.vue';
import Arrow from '../../common/icons/ArrowUpIcon.vue';
import copyIcon from '../../common/icons/CopyIcon.vue';
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
.tui-theme-white .roomInfo-container {
  --title-font-color: var(--font-color-1);
  --item-font-color: var(--font-color-6);
  --filter-color: drop-shadow(0px 0px 4px rgba(32, 77, 141, 0.03))
    drop-shadow(0px 4px 10px rgba(32, 77, 141, 0.06))
    drop-shadow(0px 1px 14px rgba(32, 77, 141, 0.05));
}

.tui-theme-black .roomInfo-container {
  --title-font-color: #8f9ab2;
  --item-font-color: var(--font-color-1);
  --filter-color: drop-shadow(0px 8px 40px rgba(23, 25, 31, 0.6))
    drop-shadow(0px 4px 12px rgba(23, 25, 31, 0.4));
}

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
  background-color: var(--background-color-2);
  filter: var(--filter-color);
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
      color: var(--title-font-color);
    }

    .roomInfo-item {
      flex-basis: 50%;
      max-width: 300px;
      overflow: hidden;
      color: var(--item-font-color);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .copy-container {
      display: flex;
      margin-left: auto;
      color: var(--active-color-2);
      cursor: pointer;

      .copy {
        width: 20px;
        height: 20px;
      }
    }
  }
}
</style>
