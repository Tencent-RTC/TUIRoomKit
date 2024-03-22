<template>
  <div class="footer-container">
    <audio-control
      v-if="!isAudience || isAdmin"
      v-tap="() => handleControlClick('audioControl')"
    ></audio-control>
    <video-control
      v-if="!isAudience || isAdmin"
      v-tap="() => handleControlClick('videoControl')"
    ></video-control>
    <chat-control
      v-if="!roomStore.isSpeakAfterTakingSeatMode"
      v-tap="() => handleControlClick('chatControl')"
    ></chat-control>
    <master-apply-control
      v-if="roomStore.isSpeakAfterTakingSeatMode && (isMaster || isAdmin)"
      v-tap="() => handleControlClick('MasterApplyControl')"
    ></master-apply-control>
    <member-apply-control
      v-if="roomStore.isSpeakAfterTakingSeatMode && !isMaster"
      v-tap="() => handleControlClick('MemberApplyControl')"
    ></member-apply-control>
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
import MasterApplyControl from '../ManageStageControl.vue';
import MemberApplyControl from '../ApplyControl/MemberApplyControl.vue';
import MoreControl from '../MoreControl';
import bus from '../../../hooks/useMitt';
import vTap from '../../../directives/vTap';

import TUIRoomAegis from '../../../utils/aegis';

import useRoomFooter from './useRoomFooterHooks';

const {
  roomStore,
  isMaster,
  isAdmin,
  isAudience,
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: row;
  padding: 0.7rem;
  background-color: var(--background-color-2);
  box-shadow: 0px -8px 30px var(--footer-shadow-color);
}
</style>
