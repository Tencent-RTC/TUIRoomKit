<template>
  <div class="home-container">
    <PreConferenceView
      :user-info="userInfo"
      @on-create-room="handleCreateRoom"
      @on-enter-room="handleEnterRoom"
    />
  </div>
</template>

<script setup lang="ts">
import PreConferenceView from '../TUIRoom/preConference.vue';
import { conference } from '../TUIRoom/index.ts';
import { getBasicInfo } from '../config/basic-info-config';
import { onMounted } from 'vue';

declare const uni: any;

const userInfo = getBasicInfo();

function setTUIRoomData(action: string, roomOption: Record<string, any>) {
  uni.setStorageSync(
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
    // 房间不存在
  }
  return isRoomExist;
}

/**
 * Generate room number when creating a room
 *
 * 创建房间时生成房间号
 **/
async function generateRoomId(): Promise<string> {
  const roomId = String(Math.ceil(Math.random() * 1000000));
  const isRoomExist = await checkRoomExistWhenCreateRoom(roomId);
  if (isRoomExist) {
    return await generateRoomId();
  }
  return roomId;
}

/**
 * Processing Click [Create Room]
 *
 * 处理点击【创建房间】
 **/
async function handleCreateRoom(roomOption: Record<string, any>) {
  const roomId = await generateRoomId();
  setTUIRoomData('createRoom', {
    roomId,
    ...roomOption,
  });
  uni.redirectTo({ url: 'room' });
}

/**
 * Processing Click [Enter Room]
 *
 * 处理点击【进入房间】
 **/
async function handleEnterRoom(roomOption: Record<string, any>) {
  setTUIRoomData('enterRoom', roomOption);
  uni.redirectTo({ url: 'room' });
}

async function handleInit() {
  uni.removeStorageSync('tuiRoom-roomInfo');
  const { userId, sdkAppId, userSig, userName, avatarUrl } = userInfo;
  await conference.login({ sdkAppId, userId, userSig });
  await conference.setSelfInfo({ userName, avatarUrl });
}

onMounted(() => {
  handleInit();
});
</script>
<style lang="scss" scoped>
.home-container {
  width: 100%;
  height: 100%;
}
</style>
