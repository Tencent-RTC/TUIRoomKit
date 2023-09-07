<template>
  <div class="footer-container">
    <div class="left-container">
      <audio-control @tap="() => handleControlClick('audioControl')"></audio-control>
      <video-control @tap="() => handleControlClick('videoControl')"></video-control>
      <chat-control
        v-if="!roomStore.isSpeakAfterTakingSeatMode"
        @tap="() => handleControlClick('chatControl')"
      ></chat-control>
      <apply-control
        v-else
        @tap="() => handleControlClick('applyControl')"
      ></apply-control>
      <manage-member-control
        v-if="roomStore.isMaster"
        @tap="() => handleControlClick('manageMemberControl')"
      ></manage-member-control>
      <more-control @tap="() => handleControlClick('moreControl')"></more-control>
    </div>
  </div>
</template>
<script setup lang="ts">
import AudioControl from '../AudioControl.vue';
import VideoControl from '../VideoControl.vue';
import ManageMemberControl from '../ManageMemberControl.vue';
import ChatControl from '../ChatControl.vue';
import ApplyControl from '../ApplyControl/Index.vue';
import MoreControl from '../MoreControl/index.vue';
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
  height: 100%;
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
