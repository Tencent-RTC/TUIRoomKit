<template>
  <div class="footer-container">
    <div class="left-container">
      <audio-control></audio-control>
      <video-control></video-control>
    </div>
    <div class="center-container">
      <screen-share-control></screen-share-control>
      <full-screen-control></full-screen-control>
      <!-- <manage-member-control></manage-member-control> -->
      <invite-control></invite-control>
      <chat-control></chat-control>
      <!-- <more-control></more-control> -->
      <setting-control></setting-control>
    </div>
    <div class="right-container">
      <end-control
        @on-room-destroy="onRoomDestroy"
        @on-room-exit="onRoomExit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AudioControl from './AudioControl.vue';
import ScreenShareControl from './ScreenShareControl/Index.vue';
import FullScreenControl from './FullScreenControl.vue';
import InviteControl from './InviteControl.vue';
import VideoControl from './VideoControl.vue';
// TODO:【成员管理】功能待完善
// import ManageMemberControl from './ManageMemberControl.vue';
import ChatControl from './ChatControl.vue';
// TODO:【更多】功能待完善
// import MoreControl from './MoreControl.vue';
import SettingControl from './SettingControl.vue';
import EndControl from './EndControl.vue';

// const props = defineProps({
//   roomRef: HTMLElement,
// });

const emit = defineEmits(['onRoomDestroy', 'onRoomExit']);

const onRoomDestroy = (info: { code: number; message: string }) => {
  emit('onRoomDestroy', info);
};

const onRoomExit = (info: { code: number; message: string }) => {
  emit('onRoomExit', info);
};
</script>

<style lang="scss" scoped>
.footer-container {
  width: 100%;
  height: 100%;
  padding-left: 9px;
  padding-right: 24px;
  display: flex;
  justify-content: space-between;
  .left-container {
    height: 100%;
    display: flex;
    align-items: center;
    > :not(:first-child) {
      margin-left: 1rem;
    }
  }
  .center-container {
    height: 100%;
    display: flex;
    align-items: center;
    position: absolute;
    left: 50%;
    transform: translate(-50%);
  }
  .right-container {
    height: 100%;
    display: flex;
    align-items: center;
  }
}

</style>
