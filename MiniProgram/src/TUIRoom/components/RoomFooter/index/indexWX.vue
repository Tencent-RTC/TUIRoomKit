<template>
  <div class="footer-container">
    <div class="left-container">
      <audio-control @click="handleControlClick('audioControl')"></audio-control>
      <video-control @click="handleControlClick('videoControl')"></video-control>
      <chat-control
        v-if="!roomStore.isSpeakAfterTakingSeatMode"
        @click="handleControlClick('chatControl')"
      ></chat-control>
      <apply-control
        v-else
        @click="handleControlClick('applyControl')"
      ></apply-control>
      <manage-member-control
        v-if="roomStore.isMaster"
        @click="handleControlClick('manageMemberControl')"
      ></manage-member-control>
      <more-control @click="handleControlClick('moreControl')"></more-control>
    </div>
  </div>
</template>
<script setup lang="ts">
import AudioControl from '../AudioControl/AudioControlWX.vue';
import VideoControl from '../VideoControl/VideoControlWX.vue';
import ManageMemberControl from '../ManageMemberControl.vue';
import ChatControl from '../ChatControlWX.vue';
import ApplyControl from '../ApplyControl/IndexWX.vue';
import MoreControl from '../MoreControl/MoreControlWX.vue';
import bus from '../../../hooks/useMitt';

import TUIRoomAegis from '../../../utils/aegis';

import useRoomFooter from './useRoomFooterHooks';

const {
  roomStore,
} = useRoomFooter();


function handleControlClick(name: string) {
  TUIRoomAegis.reportEvent({ name, ext1: name });
  bus.emit('experience-communication', name);
}
</script>

  <style scoped>
  .footer-container{
    position: absolute;
    bottom: 0;
    width: 100%;
    border-top: 1px solid aliceblue;
  }
  .left-container{
      width: 100%;
      display: flex;
      justify-content: space-evenly;
  }
  .top-container{
    position: fixed;
    top: 0;
  }
  </style>

