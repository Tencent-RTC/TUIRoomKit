<template>
  <pre-conference-view
    :user-info="userInfo"
    :room-id="givenRoomId"
    @on-create-room="handleCreateRoom"
    @on-enter-room="handleEnterRoom"
    @on-logout="handleLogOut"
    @on-update-user-name="handleUpdateUserName"
  ></pre-conference-view>
</template>

<script setup lang="ts">
import { TUIRoomEngine, PreConferenceView, conference } from '@tencentcloud/roomkit-web-vue3';
import { getBasicInfo } from '@/config/basic-info-config';
import router from '@/router';
import { useRoute } from 'vue-router';
import { Ref, ref, reactive } from 'vue';

const route = useRoute();
const { roomId } = route.query;
const givenRoomId: Ref<string> = ref((roomId) as string);

const userInfo = reactive({
  userId: '',
  userName: '',
  avatarUrl: '',
});


function setTUIRoomData(action: string, roomOption: Record<string, any>) {
  sessionStorage.setItem('tuiRoom-roomInfo', JSON.stringify({
    action,
    ...roomOption,
  }));
}

async function checkRoomExistWhenCreateRoom(roomId: string) {
  let isRoomExist = false;
  const tim = conference.getRoomEngine()?.getTIM();
  try {
    await tim?.searchGroupByID(roomId);
    isRoomExist = true;
  } catch (error: any) {
    // room does not exist
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
    const currentUserInfo = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo') as string);
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
  let currentUserInfo = null;
  if (sessionStorage.getItem('tuiRoom-userInfo')) {
    currentUserInfo = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo') as string);
  } else {
    currentUserInfo = await getBasicInfo();
    currentUserInfo && sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(currentUserInfo));
  }
  userInfo.userId = currentUserInfo?.userId;
  userInfo.userName = currentUserInfo?.userName;
  userInfo.avatarUrl = currentUserInfo?.avatarUrl;
  const { userId, sdkAppId, userSig } = currentUserInfo;
  await TUIRoomEngine.login({ sdkAppId, userId, userSig });
}

handleInit();

</script>
