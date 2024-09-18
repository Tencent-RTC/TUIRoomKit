<template>
  <pre-conference-view
    :user-info="userInfo"
    :room-id="givenRoomId"
    :enable-scheduled-conference="true"
    @on-create-room="handleCreateRoom"
    @on-enter-room="handleEnterRoom"
    @on-logout="handleLogOut"
    @on-update-user-name="handleUpdateUserName"
  />
</template>

<script setup lang="ts">
import {
  PreConferenceView,
  conference,
  RoomEvent,
  LanguageOption,
  ThemeOption,
} from '@tencentcloud/roomkit-electron-vue3';
import { getBasicInfo } from '@/config/basic-info-config';
import router from '@/router';
import { useRoute } from 'vue-router';
import { Ref, ref, reactive, onMounted, onUnmounted } from 'vue';
import i18n from '../locales/index';
import { getLanguage, getTheme } from '../utils/utils';

const route = useRoute();
const { roomId } = route.query;
const givenRoomId: Ref<string> = ref(roomId as string);

const userInfo = reactive({
  userId: '',
  userName: '',
  avatarUrl: '',
});

function setTUIRoomData(action: string, roomOption: Record<string, any>) {
  sessionStorage.setItem(
    'tuiRoom-roomInfo',
    JSON.stringify({
      action,
      ...roomOption,
    })
  );
}

async function checkRoomExistWhenCreateRoom(roomId: string) {
  let isRoomExist = false;
  const tim = conference.getRoomEngine()?.getTIM();
  try {
    await tim?.searchGroupByID(roomId);
    isRoomExist = true;
  } catch (error: any) {
    // The room doesn't exist.
  }
  return isRoomExist;
}

/**
 * Generate room number when creating a room
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
 **/
async function handleCreateRoom(roomOption: Record<string, any>) {
  setTUIRoomData('createRoom', roomOption);
  const roomId = await generateRoomId();
  router.push({
    path: 'room',
    query: {
      roomId,
    },
  });
}

/**
 * Processing Click [Enter Room]
 **/
async function handleEnterRoom(roomOption: Record<string, any>) {
  setTUIRoomData('enterRoom', roomOption);
  router.push({
    path: 'room',
    query: {
      roomId: roomOption.roomId,
    },
  });
}

function handleUpdateUserName(userName: string) {
  try {
    const currentUserInfo = JSON.parse(
      sessionStorage.getItem('tuiRoom-userInfo') as string
    );
    currentUserInfo.userName = userName;
    sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(currentUserInfo));
  } catch (error) {
    console.log('sessionStorage error', error);
  }
}

/**
 * Processing users click [Logout Login] in the upper left corner of the page
 **/
async function handleLogOut() {
  /**
   * The accessor handles the logout method
   **/
}

async function handleInit() {
  sessionStorage.removeItem('tuiRoom-roomInfo');
  sessionStorage.removeItem('tuiRoom-userInfo');
  conference.setLanguage(getLanguage() as LanguageOption);
  conference.setTheme(getTheme() as ThemeOption);
  let currentUserInfo = null;
  if (sessionStorage.getItem('tuiRoom-userInfo')) {
    currentUserInfo = JSON.parse(
      sessionStorage.getItem('tuiRoom-userInfo') as string
    );
  } else {
    currentUserInfo = await getBasicInfo();
    currentUserInfo &&
      sessionStorage.setItem(
        'tuiRoom-userInfo',
        JSON.stringify(currentUserInfo)
      );
  }
  userInfo.userId = currentUserInfo?.userId;
  userInfo.userName = currentUserInfo?.userName;
  userInfo.avatarUrl = currentUserInfo?.avatarUrl;
  const { userId, sdkAppId, userSig } = currentUserInfo;
  await conference.login({ sdkAppId, userId, userSig });
}

const changeLanguage = (language: LanguageOption) => {
  i18n.global.locale.value = language;
  localStorage.setItem('tuiRoom-language', language);
};
const changeTheme = (theme: ThemeOption) => {
  localStorage.setItem('tuiRoom-currentTheme', theme);
};
onMounted(() => {
  conference.on(RoomEvent.LANGUAGE_CHANGED, changeLanguage);
  conference.on(RoomEvent.THEME_CHANGED, changeTheme);
});

onUnmounted(() => {
  conference.off(RoomEvent.LANGUAGE_CHANGED, changeLanguage);
  conference.off(RoomEvent.THEME_CHANGED, changeTheme);
});

handleInit();
</script>
