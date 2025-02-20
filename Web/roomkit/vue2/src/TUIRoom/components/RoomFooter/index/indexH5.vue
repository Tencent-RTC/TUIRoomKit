<template>
  <div class="footer-container">
    <audio-control
      v-if="!isAudience || isAdmin"
      v-tap="() => handleControlClick('audioControl')"
    />
    <video-control
      v-if="!isAudience || isAdmin"
      v-tap="() => handleControlClick('videoControl')"
    />
    <chat-control
      v-if="!roomStore.isSpeakAfterTakingSeatMode"
      v-tap="() => handleControlClick('chatControl')"
    />
    <master-apply-control
      v-if="roomStore.isSpeakAfterTakingSeatMode && (isMaster || isAdmin)"
      v-tap="() => handleControlClick('MasterApplyControl')"
    />
    <member-apply-control
      v-if="roomStore.isSpeakAfterTakingSeatMode && !isMaster"
      v-tap="() => handleControlClick('MemberApplyControl')"
    />
    <manage-member-control
      v-tap="() => handleControlClick('manageMemberControl')"
    />
    <more-control
      v-tap="() => handleControlClick('moreControl')"
      @show-overlay="handleShowOverlay"
    />
  </div>
</template>
<script setup lang="ts">
import { defineEmits } from 'vue';
import AudioControl from '../AudioControl.vue';
import VideoControl from '../VideoControl.vue';
import ManageMemberControl from '../ManageMemberControl.vue';
import ChatControl from '../ChatControl.vue';
import MasterApplyControl from '../ManageStageControl.vue';
import MemberApplyControl from '../ApplyControl/MemberApplyControl.vue';
import MoreControl from '../MoreControl/index';
import bus from '../../../hooks/useMitt';
import '../../../directives/vTap';

import useRoomFooter from './useRoomFooterHooks';

const { roomStore, isMaster, isAdmin, isAudience } = useRoomFooter();

const emit = defineEmits(['show-overlay']);

function handleControlClick(name: string) {
  bus.emit('experience-communication', name);
}

function handleShowOverlay(data: { name: string; visible: boolean }) {
  emit('show-overlay', data);
}
</script>

<style lang="scss" scoped>
.footer-container {
  position: absolute;
  bottom: 0;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.7rem;
  background-color: var(--bg-color-topbar);
  box-shadow: 0 -8px 30px var(--uikit-color-black-8);
}
</style>
