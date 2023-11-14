<template>
  <div class="footer-container">
    <audio-control v-tap="() => handleControlClick('audioControl')"></audio-control>
    <video-control v-tap="() => handleControlClick('videoControl')"></video-control>
    <chat-control
      v-if="!roomStore.isSpeakAfterTakingSeatMode"
      v-tap="() => handleControlClick('chatControl')"
    ></chat-control>
    <apply-control
      v-else
      v-tap="() => handleControlClick('applyControl')"
    ></apply-control>
    <manage-member-control
      v-tap="() => handleControlClick('manageMemberControl')"
    ></manage-member-control>
    <more-control v-tap="() => handleControlClick('moreControl')"></more-control>
  </div>
</template>
<script setup lang="ts">
import AudioControl from '../AudioControl.vue';
import VideoControl from '../VideoControl.vue';
import ManageMemberControl from '../ManageMemberControl.vue';
import ChatControl from '../ChatControl.vue';
import ApplyControl from '../ApplyControl/Index.vue';
import MoreControl from '../MoreControl';
import bus from '../../../hooks/useMitt';
import '../../../directives/vTap';

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
  display: flex;
  justify-content: space-around;
  align-items: center;
}
</style>
