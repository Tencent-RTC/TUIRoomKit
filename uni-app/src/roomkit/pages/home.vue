<template>
  <div class="home-container" :class="[`tui-theme-${defaultTheme}`]">
    <div class="header">
      <div class="left-header">
        <switch-theme :visible="false" class="header-item"></switch-theme>
      </div>
      <div class="right-header">
        <user-info
          class="header-item user-info"
          :user-id="userId"
          :user-name="userName"
          :avatar-url="avatarUrl"
          @log-out="handleLogOut"
        ></user-info>
      </div>
    </div>
    <room-control
      ref="roomControlRef"
      :user-name="userName"
      @create-room="handleCreateRoom"
      @enter-room="handleEnterRoom"
    ></room-control>
  </div>
</template>

<script setup lang="ts">
import { TUILogin } from '@tencentcloud/tui-core';
import UserInfo from '../TUIRoom/components/RoomHeader/UserInfo/index.vue';
import RoomControl from '../TUIRoom/components/RoomHome/RoomControl/index.vue';
import SwitchTheme from '../TUIRoom/components/common/SwitchTheme.vue';
import router from '../../router';
import { Ref, ref } from 'vue';
import { getBasicInfo } from '../config/basic-info-config';
import { useBasicStore } from '../TUIRoom/stores/basic';
import { storeToRefs } from 'pinia';
import { roomChatInit } from '../TUIKit';

const userName: Ref<string> = ref('');
const avatarUrl: Ref<string> = ref('');
const userId: Ref<string> = ref('');
const basicStore = useBasicStore();
const { defaultTheme } = storeToRefs(basicStore);
const roomControlRef = ref();


function setTUIRoomData(action: string, mode?: string) {
  const roomParam = roomControlRef.value.getRoomParam();
  const roomData = {
    action,
    roomMode: mode || 'FreeToSpeak',
    roomParam,
  };
  uni.setStorageSync('tuiRoom-roomInfo', JSON.stringify(roomData));
}

/**
 * Generate room number when creating a room
 *
 * 创建房间时生成房间号
**/
async function generateRoomId(): Promise<string> {
  const roomId = String(Math.ceil(Math.random() * 1000000));
  return roomId;
}

/**
 * Processing Click [Create Room]
 *
 * 处理点击【创建房间】
**/
async function handleCreateRoom(mode: string) {
  setTUIRoomData('createRoom', mode);
  const roomId = await generateRoomId();
  router.replace({
    path: 'room',
    query: {
      roomId,
    },
  });
}

/**
 * Processing Click [Enter Room]
 *
 * 处理点击【进入房间】
**/
async function handleEnterRoom(roomId: string) {
  setTUIRoomData('enterRoom');
  router.replace({
    path: 'room',
    query: {
      roomId,
    },
  });
}

async function handleInit() {
  uni.removeStorageSync('tuiRoom-roomInfo');
  uni.removeStorageSync('tuiRoom-userInfo');
  const currentUserInfo = getBasicInfo();
  if (!currentUserInfo) {
    return;
  }
  uni.setStorageSync('tuiRoom-userInfo', JSON.stringify(currentUserInfo));
  basicStore.setBasicInfo(currentUserInfo);
  userName.value = currentUserInfo.userName;
  avatarUrl.value = currentUserInfo.avatarUrl;
  userId.value = currentUserInfo.userId;
  const { sdkAppId, userSig } = currentUserInfo;

  TUILogin.login({
	   SDKAppID: sdkAppId,
	   userID: userId.value,
	   userSig,
	   useUploadPlugin: true, // If you need to send rich media messages, please set to true.
	 });
  roomChatInit();
}

handleInit();
</script>

<style>
@import '../TUIRoom/assets/style/global.scss';
@import '../TUIRoom/assets/style/black-theme.scss';
@import '../TUIRoom/assets/style/white-theme.scss';

* {
    transition: background-color .5s,color .5s !important;
  }
</style>

<style lang="scss" scoped>

.tui-theme-black.home-container {
  --background: var(--background-color-1);
}

.tui-theme-white.home-container {
  --background: var(--background-color-1);
}

.home-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-family: "PingFang SC";
  color: var(--font-color-1);
  background: var(--background);
  background-size: cover;

  .header {
    position: absolute;
    top: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 22px 24px;

    .left-header, .right-header {
      display: flex;
      align-items: center;

      .header-item {
        &:not(:first-child) {
          margin-left: 16px;
        }
      }
    }
  }
}
</style>
