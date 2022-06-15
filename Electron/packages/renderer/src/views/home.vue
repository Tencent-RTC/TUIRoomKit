<template>
  <div class="home-container">
    <div class="header">
      <user-info
        class="header-item user-info"
        :user-id="userId"
        :user-name="userName"
        :user-avatar="userAvatar"
        @log-out="handleLogOut"
      ></user-info>
    </div>
    <stream-preview ref="streamPreviewRef"></stream-preview>
    <room-control
      :given-room-id="givenRoomId"
      @create-room="handleCreateRoom"
      @enter-room="handleEnterRoom"
    ></room-control>
  </div>
</template>

<script setup lang="ts">
import UserInfo from '@/TUIRoom/components/RoomHeader/UserInfo.vue';
import StreamPreview from '@/TUIRoom/components/RoomHome/StreamPreview.vue';
import RoomControl from '@/TUIRoom/components/RoomHome/RoomControl.vue';
import TUIRoomCore from '@/TUIRoom/tui-room-core';
import router from '@/router';
import { useRoute } from 'vue-router';
import { onMounted, Ref, ref } from 'vue';
import { getBasicInfo } from '@/config/basic-info-config';

const route = useRoute();
const streamPreviewRef = ref();
const userName = ref();
const userAvatar = ref();
const userId = ref();

const givenRoomId: Ref<string> = ref((route.query.roomId || '') as string);

const basicInfo = getBasicInfo();
userName.value = basicInfo?.userName;
userAvatar.value = basicInfo?.userAvatar;
userId.value = basicInfo?.userId;

function setTUIRoomData(action: string) {
  const roomParam = streamPreviewRef.value.getRoomParam();
  const roomData = {
    action,
    roomMode: 'FreeSpeech',
    roomParam,
  };
  sessionStorage.setItem('tuiRoom-roomInfo', JSON.stringify(roomData));
}

// 创建房间时生成房间号
async function generateRoomId(): Promise<number> {
  const roomId = Math.ceil(Math.random() * 1000000);
  const isRoomExist = await TUIRoomCore.checkRoomExistence(roomId);
  if (isRoomExist) {
    return await generateRoomId();
  }
  return roomId;
}

// 处理点击【创建房间】
async function handleCreateRoom() {
  setTUIRoomData('createRoom');
  const roomId = await generateRoomId();
  router.replace({
    path: 'room',
    query: {
      roomId,
    },
  });
}

// 处理点击【进入房间】
async function handleEnterRoom(roomId: number) {
  const isRoomExist = await TUIRoomCore.checkRoomExistence(roomId);
  if (!isRoomExist) {
    alert('房间不存在，请确认房间号或创建房间！');
    return;
  }
  setTUIRoomData('enterRoom');
  router.replace({
    path: 'room',
    query: {
      roomId,
    },
  });
}

// 处理用户点击页面左上角【退出登录】
async function handleLogOut() {
  // 接入方处理 logout 方法
}

onMounted(async () => {
  const currentUserInfo = await getBasicInfo();
  if (currentUserInfo) {
    sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(currentUserInfo));
    const { sdkAppId, userId, userSig } = currentUserInfo;
    // 登录 TUIRoomCore, 只有登录 TUIRoomCore 之后，才可以使用 TUIRoomCore.checkRoomExistence 方法
    await TUIRoomCore.login(sdkAppId, userId, userSig);
  }
});

</script>

<style lang="scss" scoped>
.home-container {
  width: 100%;
  height: 100%;
  background-color: #010101;
  color: #B3B8C8;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: PingFangSC-Medium;
  .header {
    width: 100%;
    position: absolute;
    top: 0;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    .header-item {
      &:not(:first-child) {
        margin-left: 16px;
      }
    }
  }
}
</style>
