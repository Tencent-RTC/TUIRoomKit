<template>
  <div class="footer-container">
    <div class="left-container">
      <audio-control class="left-container-item" @click="handleControlClick('audioControl')"></audio-control>
      <video-control class="left-container-item" @click="handleControlClick('videoControl')"></video-control>
    </div>
    <div class="center-container">
      <screen-share-control
        class="center-container-item"
        @click="handleControlClick('screenShareControl')"
      ></screen-share-control>
      <full-screen-control
        class="center-container-item"
        @click="handleControlClick('fullScreenControl')"
      ></full-screen-control>
      <manage-member-control
        v-if="roomStore.isMaster"
        class="center-container-item"
        @click="handleControlClick('manageMemberControl')"
      ></manage-member-control>
      <invite-control
        class="center-container-item"
        @click="handleControlClick('inviteControl')"
      ></invite-control>
      <chat-control
        class="center-container-item"
        @click="handleControlClick('chatControl')"
      ></chat-control>
      <apply-control
        v-if="roomStore.isSpeakAfterTakingSeatMode"
        class="center-container-item"
        @click="handleControlClick('applyControl')"
      ></apply-control>
      <more-control
        class="center-container-item"
        @click="handleControlClick('moreControl')"
      ></more-control>
      <setting-control
        class="center-container-item"
        @click="handleControlClick('settingControl')"
      ></setting-control>
    </div>
    <div class="right-container">
      <end-control
        @on-destroy-room="onDestroyRoom"
        @on-exit-room="onExitRoom"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AudioControl from '../AudioControl.vue';
import ScreenShareControl from '../ScreenShareControl/Index.vue';
import FullScreenControl from '../FullScreenControl.vue';
import InviteControl from '../InviteControl.vue';
import VideoControl from '../VideoControl.vue';
import ManageMemberControl from '../ManageMemberControl.vue';
import ChatControl from '../ChatControl.vue';
import ApplyControl from '../ApplyControl/Index.vue';
import MoreControl from '../MoreControl/index.vue';
import EndControl from '../EndControl/index.vue';
import SettingControl from '../SettingControl.vue';
import bus from '../../../hooks/useMitt';


import TUIRoomAegis from '../../../utils/aegis';

import useRoomFooter from './useRoomFooterHooks';

const {
  roomStore,
} = useRoomFooter();

const emit = defineEmits(['on-destroy-room', 'on-exit-room']);

const onDestroyRoom = (info: { code: number; message: string }) => {
  emit('on-destroy-room', info);
  TUIRoomAegis.reportEvent({ name: 'destroyRoom', ext1: 'destroyRoom-success' });
};

const onExitRoom = (info: { code: number; message: string }) => {
  emit('on-exit-room', info);
  TUIRoomAegis.reportEvent({ name: 'exitRoom', ext1: 'exitRoom-success' });
};

function handleControlClick(name: string) {
  TUIRoomAegis.reportEvent({ name, ext1: name });
  bus.emit('experience-communication', name);
}
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
    .left-container-item:not(:first-child) {
      margin-left: 1rem;
    }
  }
  .center-container {
    height: 100%;
    display: flex;
    align-items: center;
    position: relative;
    margin: 0 auto;
    .center-container-item:not(:first-child) {
      margin-left: 16px;
    }
  }
  .right-container {
    height: 100%;
    display: flex;
    align-items: center;
  }
}

</style>
