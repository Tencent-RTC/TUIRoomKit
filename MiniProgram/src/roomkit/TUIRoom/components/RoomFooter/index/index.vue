<template>
  <div class="footer-container">
    <audio-control
      v-if="!isAudience || isAdmin"
      @tap="() => handleControlClick('audioControl')"
    />
    <video-control
      v-if="!isAudience || isAdmin"
      @tap="() => handleControlClick('videoControl')"
    />
    <chat-control
      v-if="!roomStore.isSpeakAfterTakingSeatMode"
      @tap="() => handleControlClick('chatControl')"
    />
    <master-apply-control
      v-if="roomStore.isSpeakAfterTakingSeatMode && (isMaster || isAdmin)"
      @tap="() => handleControlClick('MasterApplyControl')"
    />
    <member-apply-control
      v-if="roomStore.isSpeakAfterTakingSeatMode && !isMaster"
      @tap="() => handleControlClick('MemberApplyControl')"
    />
    <manage-member-control
      @tap="() => handleControlClick('manageMemberControl')"
    />
    <more-control @tap="() => handleControlClick('moreControl')" />
  </div>
</template>
<script setup lang="ts">
import AudioControl from '../AudioControl.vue';
import VideoControl from '../VideoControl.vue';
import ManageMemberControl from '../ManageMemberControl.vue';
import ChatControl from '../ChatControl.vue';
import MasterApplyControl from '../ManageStageControl.vue';
import MemberApplyControl from '../ApplyControl/MemberApplyControl.vue';
import MoreControl from '../MoreControl/index.vue';
import bus from '../../../hooks/useMitt';

import useRoomFooter from './useRoomFooterHooks';

const { roomStore, isMaster, isAdmin, isAudience } = useRoomFooter();

function handleControlClick(name: string) {
  bus.emit('experience-communication', name);
}
</script>

<style scoped>
.footer-container {
  position: absolute;
  bottom: 0;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.7rem;
  background-color: var(--background-color-2);
  box-shadow: 0 -8px 30px var(--footer-shadow-color);
}
</style>
