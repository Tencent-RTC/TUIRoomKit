<template>
  <div class="home-container">
    <PreConferenceView
      :user-info="userInfo"
      @on-create-room="handleCreateRoom"
      @on-enter-room="handleEnterRoom"
    ></PreConferenceView>
  </div>
</template>

<script setup lang="ts">
import { TUILogin } from '@tencentcloud/tui-core';
import PreConferenceView from '../TUIRoom/preConference.vue';
import router from '../../router';
import { reactive } from 'vue';
import { getBasicInfo } from '../config/basic-info-config';
import { useBasicStore } from '../TUIRoom/stores/basic';
import { roomChatInit } from '../TUIKit';

const userInfo = reactive({
  userId: '',
  userName: '',
  avatarUrl: '',
});

const basicStore = useBasicStore();


function setTUIRoomData(action: string, roomOption: Record<string, any>) {
  uni.setStorageSync('tuiRoom-roomInfo', JSON.stringify({
    action,
    ...roomOption,
  }));
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
async function handleCreateRoom(roomOption: Record<string, any>) {
  setTUIRoomData('createRoom', roomOption);
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
async function handleEnterRoom(roomOption: Record<string, any>) {
  setTUIRoomData('enterRoom', roomOption);
  router.replace({
    path: 'room',
    query: {
      roomId: roomOption.roomId,
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
  userInfo.userName = currentUserInfo.userName;
  userInfo.avatarUrl = currentUserInfo.avatarUrl;
  userInfo.userId = currentUserInfo.userId;
  const { sdkAppId, userSig } = currentUserInfo;

  TUILogin.login({
	   SDKAppID: sdkAppId,
	   userID: userInfo.userId,
	   userSig,
	   useUploadPlugin: true, // If you need to send rich media messages, please set to true.
	 });
  roomChatInit();
}

handleInit();
</script>

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
