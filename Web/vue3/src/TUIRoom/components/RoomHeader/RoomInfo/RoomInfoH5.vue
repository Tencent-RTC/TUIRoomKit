<template>
  <div v-if="isShowRoomInfoTitle" class="conference-container">
    <div class="title-container" @click="toggleShowRoomInfoStatus">
      <div class="title-text">
        <span class="text">{{ conferenceTitle }}</span>
        <svg-icon :class="['arrow-icon', { 'arrow-down-icon': arrowDirection }]" :icon="Arrow"></svg-icon>
      </div>
      <room-time class="text"></room-time>
    </div>
    <div v-if="isShowRoomInfo" class="roomInfo-container">
      <div class="roomInfo-container-main">
        <div class="roomInfo-conference-title">
          <span class="master-header">{{ conferenceTitle }}</span>
          <span class="cancel" @click="handleCloseRoomInfo">{{ t('Cancel') }}</span>
        </div>
        <div v-for="item in roomInfoTabList" :key="item.id" class="roomInfo-content">
          <span class="roomInfo-title">{{ t(item.title) }}</span>
          <span class="roomInfo-item">{{ item.content }}</span>
          <div v-if="item.isShowCopyIcon && !isWeChat" class="copy-container" @click="onCopy(item.copyLink)">
            <svg-icon class="copy" :icon="copyIcon"></svg-icon>
          </div>
        </div>
        <div v-if="!isWeChat" class="roomInfo-bottom">
          <span>{{ t('You can share the room number or link to invite more people to join the room.') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import useRoomInfo from './useRoomInfoHooks';

const {
  t,
  SvgIcon,
  isWeChat,
  Arrow,
  arrowDirection,
  copyIcon,
  RoomTime,
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
  max-width: 300px;
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  .title-text {
    display: flex;
  }
  .arrow-icon {
    display: flex;
    margin-left: 5px;
    background-size: cover;
    width: 16px;
    height: 16px;
    align-items: center;
    transform: rotateX(180deg);
  }
  .arrow-down-icon {
    transform: rotateX(0);
  }
}

.text {
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--input-font-color);
}
.master-header {
  max-width: 300px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 20px 0;
}
.text-right {
  padding-left: 30px;
}
.text-type {
  padding-left: 12px;
}
.roomInfo-middle {
  color: var(--popup-title-color-h5);
  padding-left: 25px;
}
.roomInfo-container {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 100vw;
  height: auto;
  box-sizing: border-box;
  background-color: var(--log-out-mobile);
  .roomInfo-container-main {
    width: 100%;
    background: var(--popup-background-color-h5);
    border-radius: 15px 15px 0px 0px;
    position: fixed;
    bottom: 0;
    display: flex;
    flex-direction: column;
    animation-duration: 300ms;
    animation-name: popup;
    padding-bottom: 4vh;
    gap: 5px;
    @keyframes popup {
      from {
        transform-origin: bottom;
        transform: scaleY(0);
      }
      to {
        transform-origin: bottom;
        transform: scaleY(1);
      }
    }
    .roomInfo-conference-title {
      display: flex;
      flex-direction: row;
      align-items: center;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 20px;
      line-height: 24px;
      color: var(--popup-title-color-h5);
      padding: 0px 0 0 25px;
      position: relative;
    }
    .roomInfo-content {
      display: flex;
      align-items: stretch;
      font-size: 14px;
      font-weight: 400;
      line-height: normal;
      letter-spacing: -0.24px;
      color: var(--popup-title-color-h5);
      padding: 0 25px;
      .roomInfo-title {
        flex-basis: 30%;
        color: var(--title-font-color);
      }
      .roomInfo-item {
        flex-basis: 50%;
        overflow: hidden;
        max-width: 300px;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--item-font-color);
      }
      .copy-container {
        margin-left: auto;
        display: flex;
        cursor: pointer;
        color: var(--active-color-2);
        .copy {
          width: 20px;
          height: 20px;
        }
      }
    }

    .roomInfo-bottom {
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 400;
      font-size: 12px;
      line-height: 17px;
      text-align: center;
      color: var(--popup-title-color-h5);
      padding-top: 2vh;
    }
  }
}
.cancel {
  flex: 1;
  text-align: end;
  padding-right: 30px;
  font-weight: 400;
  font-size: 16px;
}
</style>
