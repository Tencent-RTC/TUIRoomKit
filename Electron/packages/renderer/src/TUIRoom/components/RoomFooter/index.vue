<template>
  <div class="footer-container">
    <div class="left-container">
      <audio-control @click="report('audioControl')"></audio-control>
      <video-control @click="report('videoControl')"></video-control>
    </div>
    <div class="center-container">
      <screen-share-control @click="report('screenShareControl')"></screen-share-control>
      <full-screen-control @click="report('fullScreenControl')"></full-screen-control>
      <manage-member-control
        v-if="basicStore.role === ETUIRoomRole.MASTER"
        @click="report('manageMemberControl')"
      ></manage-member-control>
      <invite-control @click="report('inviteControl')"></invite-control>
      <chat-control @click="report('chatControl')"></chat-control>
      <apply-control
        v-if="basicStore.roomMode === ETUISpeechMode.APPLY_SPEECH"
        @click="report('applyControl')"
      ></apply-control>
      <more-control @click="report('moreControl')"></more-control>
      <setting-control @click="report('settingControl')"></setting-control>
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
import { ETUIRoomRole, ETUISpeechMode } from '../../tui-room-core';
import AudioControl from './AudioControl.vue';
import ScreenShareControl from './ScreenShareControl/Index.vue';
import FullScreenControl from './FullScreenControl.vue';
import InviteControl from './InviteControl.vue';
import VideoControl from './VideoControl.vue';
import ManageMemberControl from './ManageMemberControl.vue';
import ChatControl from './ChatControl.vue';
import ApplyControl from './ApplyControl/Index.vue';
import MoreControl from './MoreControl.vue';
import SettingControl from './SettingControl.vue';
import EndControl from './EndControl.vue';

import { useBasicStore } from '../../stores/basic';
import TUIRoomAegis from '../../utils/aegis';

// const props = defineProps({
//   roomRef: HTMLElement,
// });
const basicStore = useBasicStore();
const emit = defineEmits(['onDestroyRoom', 'onExitRoom']);

const onDestroyRoom = (info: { code: number; message: string }) => {
  emit('onDestroyRoom', info);
  TUIRoomAegis.reportEvent({ name: 'destroyRoom', ext1: 'destroyRoom-success' });
};

const onExitRoom = (info: { code: number; message: string }) => {
  emit('onExitRoom', info);
  TUIRoomAegis.reportEvent({ name: 'exitRoom', ext1: 'exitRoom-success' });
};

function report(name: string) {
  TUIRoomAegis.reportEvent({ name, ext1: name });
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
