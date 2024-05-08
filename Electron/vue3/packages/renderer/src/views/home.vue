<template>
  <div class="home-container">
    <div class="header">
      <div class="left-header">
        <switch-theme class="header-item"></switch-theme>
      </div>
      <div class="right-header">
        <language-icon class="header-item language"></language-icon>
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
      :given-room-id="givenRoomId"
      :user-name="userName"
      @create-room="handleCreateRoom"
      @enter-room="handleEnterRoom"
      @update-user-name="handleUpdateUserName"
    ></room-control>
  </div>
</template>

<script setup lang="ts">
import UserInfo from '@TUIRoom/components/RoomHeader/UserInfo/index.vue';
import RoomControl from '@TUIRoom/components/RoomHome/RoomControl/index.vue';
import LanguageIcon from '@/TUIRoom/components/common/Language.vue';
import SwitchTheme from '@/TUIRoom/components/common/SwitchTheme.vue';
import { checkNumber } from '@/TUIRoom/utils/common';
import router from '@/router';
import { useRoute } from 'vue-router';
import { Ref, ref } from 'vue';
import { getBasicInfo } from '@/config/basic-info-config';
import { useBasicStore } from '../TUIRoom/stores/basic';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-electron';
import useGetRoomEngine from '../TUIRoom/hooks/useRoomEngine';

const route = useRoute();
const userName: Ref<string> = ref('');
const avatarUrl: Ref<string> = ref('');
const userId: Ref<string> = ref('');
const roomEngine = useGetRoomEngine();
const basicStore = useBasicStore();
const roomControlRef = ref();

const roomId = checkNumber((route.query.roomId) as string) ? route.query.roomId : '';
const givenRoomId: Ref<string> = ref((roomId) as string);

function setTUIRoomData(action: string, mode?: string) {
  const roomParam = roomControlRef.value.getRoomParam();
  const roomData = {
    action,
    roomMode: mode || 'FreeToSpeak',
    roomParam,
  };
  sessionStorage.setItem('tuiRoom-roomInfo', JSON.stringify(roomData));
}

async function checkRoomExistWhenCreateRoom(roomId: string) {
  let isRoomExist = false;
  const tim = roomEngine.instance?.getTIM();
  try {
    await tim?.searchGroupByID(roomId);
    isRoomExist = true;
  } catch (error: any) {
  }
  return isRoomExist;
}

/**
 * Generate room number when creating a room
 *
**/
async function generateRoomId(): Promise<string> {
  const roomId = String(Math.ceil(Math.random() * 1000000));
  const isRoomExist = await checkRoomExistWhenCreateRoom(String(roomId));
  if (isRoomExist) {
    return await generateRoomId();
  }
  return roomId;
}

/**
 * Processing Click [Create Room]
 *
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
**/
async function handleLogOut() {
/**
 * The accessor handles the logout method
 *
**/
}

async function handleInit() {
  sessionStorage.removeItem('tuiRoom-roomInfo');
  sessionStorage.removeItem('tuiRoom-userInfo');
  let currentUserInfo = null;
  if (sessionStorage.getItem('tuiRoom-userInfo')) {
    currentUserInfo = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo') as string);
  } else {
    currentUserInfo = await getBasicInfo();
    currentUserInfo && sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(currentUserInfo));
  }
  basicStore.setBasicInfo(currentUserInfo);
  userName.value = currentUserInfo?.userName;
  avatarUrl.value = currentUserInfo?.avatarUrl;
  userId.value = currentUserInfo?.userId;
  const { sdkAppId, userSig } = currentUserInfo;
  /**
   * TUIRoomCore.checkRoomExistence method can only be used after logging into TUIRoomCore.
   *
  **/
  await TUIRoomEngine.login({ sdkAppId, userId: userId.value, userSig });
}

handleInit();

</script>

<style>
@import '../TUIRoom/assets/style/black-theme.scss';
@import '../TUIRoom/assets/style/white-theme.scss';
</style>

<style lang="scss" scoped>
.tui-theme-black .home-container {
  --background: var(--background-color-1);
}
.tui-theme-white .home-container {
  --background: url(../TUIRoom/assets/imgs/background-white.png);
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
    .left-header,
    .right-header {
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
