<template>
  <div v-if="isShowRoomInfoTitle" class="conference-container">
    <div class="title-container" @click="toggleShowRoomInfoStatus">
      <div class="title-text">
        <span class="text">{{ conferenceTitle }}</span>
        <span :class="['arrow-icon', { 'arrow-down-icon': arrowDirection }]">
          <svg-icon icon="ArrowUpIcon"></svg-icon>
        </span>
      </div>
      <room-time class="text"></room-time>
    </div>
    <div v-if="isShowRoomInfo" class="roomInfo-container" @touchmove.stop.prevent="() => {}">
      <div class="roomInfo-container-main">
        <div class="roomInfo-conference-title">
          <text class="master-header">{{ conferenceTitle }}</text>
          <text class="cancel" @click="handleCloseRoomInfo">{{ t('Cancel') }}</text>
        </div>
        <div v-for="item in roomInfoTabList" :key="item.id">
          <div v-if="item.visible" class="roomInfo-content">
            <text class="roomInfo-title">{{ t(item.title) }}</text>
            <text class="roomInfo-item">{{ item.content }}</text>
            <div v-if="item.isShowCopyIcon && item.visible" class="copy-container" @click="onCopy(item.copyLink)">
              <svg-icon style="display: flex" class="copy" icon="CopyIcon"></svg-icon>
            </div>
          </div>
        </div>
        <div v-if="isH5" class="roomInfo-bottom">
          <span>{{ t('You can share the room number or link to invite more people to join the room.') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import useRoomInfo from './useRoomInfoHooks';
import SvgIcon from '../../common/base/SvgIcon.vue';
import RoomTime from '../../common/RoomTime.vue';
import { isH5 } from '../../../utils/environment';


const {
  t,
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
  // width: 350px;
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  .title-text {
    flex-direction: row;
    align-items: center;
  }
  .arrow-icon {
    display: flex;
    margin-left: 5px;
    background-size: cover;
    align-items: center;
    transform: rotate(180deg);
  }
  .arrow-down-icon {
    transform: rotate(0deg);
  }
}

.text {
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #000000;
}
.text-right {
  padding-left: 30px;
}
.text-type {
  padding-left: 12px;
}
.roomInfo-middle {
  color: #141313;
  padding-left: 25px;
}
.roomInfo-container {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 750rpx;
  height: auto;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.7);
  .roomInfo-container-main {
    width: 750rpx;
    background: #d4d4d4;
    border-radius: 15px 15px 0px 0px;
    position: fixed;
    bottom: 0;
    display: flex;
    flex-direction: column;
    animation-duration: 200ms;
    animation-name: popup;
    padding-bottom: 20px;
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
      padding: 0 0 0 25px;
      .master-header {
        max-width: 300px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        padding: 20px 0;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 500;
        font-size: 20px;
        line-height: 24px;
        color: #141313;
      }
      .cancel {
        font-family: "PingFang SC";
        font-style: normal;
        line-height: 24px;
        color: #141313;
        flex: 1;
        text-align: right;
        font-weight: 400;
      	padding-right: 30px;
        font-size: 16px;
      }
    }
    .roomInfo-content {
      display: flex;
      align-items: stretch;
      flex-direction: row;
      padding: 5px 25px;
      .roomInfo-title {
        display: flex;
        width: 225rpx;
        font-size: 14px;
        font-weight: 400;
        line-height: normal;
        letter-spacing: -0.24px;
        color: #141313;
      }
      .roomInfo-item {
        width: 375rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        font-weight: 400;
        line-height: normal;
        letter-spacing: -0.24px;
        color: #141313;
      }
      .copy-container {
				position: absolute;
				right: 40rpx;
        cursor: pointer;
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
      color: #141313;
      padding-top: 2vh;
			padding-left: 40rpx;
    }
  }
}
</style>
