<template>
  <div v-if="isShowRoomInfoTitle" class="conference-container">
    <div class="title-container" @click="toggleShowRoomInfoStatus">
      <div class="title-text">
        <span class="text">{{ conferenceTitle }}</span>
        <svg-icon
          :class="['arrow-icon', { 'arrow-down-icon': arrowDirection }]"
          :icon="Arrow"
        />
      </div>
      <room-time class="text" />
    </div>
    <div v-if="isShowRoomInfo" class="room-info-container">
      <div class="room-info-container-main">
        <div class="room-info-conference-title">
          <span class="master-header">{{ conferenceTitle }}</span>
          <span class="cancel" @click="handleCloseRoomInfo">{{
            t('Cancel')
          }}</span>
        </div>
        <div v-for="item in roomInfoTabList" :key="item.id">
          <div v-if="item.visible" class="room-info-content">
            <span class="room-info-title">{{ t(item.title) }}</span>
            <span class="room-info-item">{{ item.content }}</span>
            <div
              v-if="item.isShowCopyIcon && item.visible"
              class="copy-container"
              @click="onCopy(item.copyLink)"
            >
              <svg-icon class="copy" :icon="copyIcon" />
            </div>
          </div>
        </div>
        <div v-if="!isWeChat" class="room-info-bottom">
          <span>{{
            t(
              'You can share the room number or link to invite more people to join the room.'
            )
          }}</span>
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
import RoomTime from '../../common/RoomTime.vue';

const {
  t,
  isWeChat,
  arrowDirection,
  handleCloseRoomInfo,
  isShowRoomInfo,
  isShowRoomInfoTitle,
  conferenceTitle,
  roomInfoTabList,
  toggleShowRoomInfoStatus,
  onCopy,
} = useRoomInfo();
</script>

<style lang="scss" scoped>
.conference-container {
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;

  .title-text {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .arrow-icon {
    display: flex;
    align-items: center;
    margin-left: 5px;
    background-size: cover;
    transform: rotateX(180deg);
  }

  .arrow-down-icon {
    transform: rotateX(0);
  }
}

.text {
  max-width: 76%;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  color: var(--input-font-color);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.master-header {
  max-width: 300px;
  padding: 20px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-right {
  padding-left: 30px;
}

.text-type {
  padding-left: 12px;
}

.room-info-middle {
  padding-left: 25px;
  color: var(--popup-title-color-h5);
}

.room-info-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  width: 100vw;
  height: auto;
  background-color: var(--log-out-mobile);

  .room-info-container-main {
    position: fixed;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
    padding-bottom: 4vh;
    background: var(--popup-background-color-h5);
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

    .room-info-conference-title {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0 0 0 25px;
      font-family: 'PingFang SC';
      font-size: 20px;
      font-style: normal;
      font-weight: 500;
      line-height: 24px;
      color: var(--popup-title-color-h5);
    }

    .room-info-content {
      display: flex;
      align-items: stretch;
      padding: 0 25px;
      font-size: 14px;
      font-weight: 400;
      line-height: normal;
      color: var(--popup-title-color-h5);
      letter-spacing: -0.24px;

      .room-info-title {
        flex-basis: 30%;
        color: var(--title-font-color);
      }

      .room-info-item {
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

    .room-info-bottom {
      padding-top: 2vh;
      font-family: 'PingFang SC';
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 17px;
      color: var(--popup-title-color-h5);
      text-align: center;
    }
  }
}

.cancel {
  flex: 1;
  padding-right: 30px;
  font-size: 16px;
  font-weight: 400;
  text-align: end;
  white-space: nowrap;
}
</style>
