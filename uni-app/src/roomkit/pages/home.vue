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

import UserInfo from '../TUIRoom/components/RoomHeader/UserInfo/index.vue';
import RoomControl from '../TUIRoom/components/RoomHome/RoomControl/index.vue';
import SwitchTheme from '../TUIRoom/components/common/SwitchTheme.vue';
import router from '../../router';
import { Ref, ref } from 'vue';
import { getBasicInfo } from '../config/basic-info-config';
import { useBasicStore } from '../TUIRoom/stores/basic';
import { TUIRoomEngine } from '@tencentcloud/tuiroom-engine-uniapp-app';
import { storeToRefs } from 'pinia';


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
  // const isRoomExist = await checkRoomExistWhenCreateRoom(String(roomId));
  // if (isRoomExist) {
  //   return await generateRoomId();
  // }
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

/**
 * Processing users click [Logout Login] in the upper left corner of the page
 *
 * 处理用户点击页面左上角【退出登录】
**/
async function handleLogOut() {
/**
 * The accessor handles the logout method
 *
 * 接入方处理 logout 方法
**/
}

async function handleInit() {
  uni.removeStorageSync('tuiRoom-roomInfo');
  uni.removeStorageSync('tuiRoom-userInfo');
  let currentUserInfo = null;
  if (uni.getStorageSync('tuiRoom-userInfo')) {
    currentUserInfo = JSON.parse(uni.getStorageSync('tuiRoom-userInfo') as string);
  } else {
    currentUserInfo = await getBasicInfo();
    currentUserInfo && uni.setStorageSync('tuiRoom-userInfo', JSON.stringify(currentUserInfo));
  }
  basicStore.setBasicInfo(currentUserInfo);
  userName.value = currentUserInfo?.userName;
  avatarUrl.value = currentUserInfo?.avatarUrl;
  userId.value = currentUserInfo?.userId;
  const { sdkAppId, userSig } = currentUserInfo;
  /**
   * TUIRoomCore.checkRoomExistence method can only be used after logging into TUIRoomCore.
   *
   * 登录 TUIRoomCore, 只有登录 TUIRoomCore 之后，才可以使用 TUIRoomCore.checkRoomExistence 方法
  **/
  await TUIRoomEngine.login({ sdkAppId, userId: userId.value, userSig });
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
  width: 100%;
  height: 100%;
  background: var(--background);
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: PingFang SC;
  color: var(--font-color-1);
  .header {
    box-sizing: border-box;
    width: 100%;
    position: absolute;
    top: 0;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
