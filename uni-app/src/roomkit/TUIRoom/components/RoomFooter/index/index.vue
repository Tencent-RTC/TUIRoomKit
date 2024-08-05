<template>
  <div class="footer-container" :class="[showRoomTool ? '' : 'footer-hidden']">
    <audio-control
      v-if="!isAudience || isAdmin"
      @tap="() => handleControlClick('audioControl')"
    ></audio-control>
    <video-control
      v-if="!isAudience || isAdmin"
      @tap="() => handleControlClick('videoControl')"
    ></video-control>
    <!-- <chat-control
      v-if="!roomStore.isSpeakAfterTakingSeatMode"
      @tap="() => handleControlClick('chatControl')"
    ></chat-control> -->
    <master-apply-control
      v-if="roomStore.isSpeakAfterTakingSeatMode && (isMaster || isAdmin)"
      @tap="() => handleControlClick('MasterApplyControl')"
    ></master-apply-control>
    <screen-share-control
      class="center-container-item"
      @click="handleControlClick('screenShareControl')"
    ></screen-share-control>
    <member-apply-control
      v-if="roomStore.isSpeakAfterTakingSeatMode && !isMaster"
      @tap="() => handleControlClick('MemberApplyControl')"
    ></member-apply-control>
    <manage-member-control
      @tap="() => handleControlClick('manageMemberControl')"
    ></manage-member-control>
    <more-control @tap="() => handleControlClick('moreControl')"></more-control>
  </div>
</template>
<script setup lang="ts">
import { inject } from 'vue';
import AudioControl from '../AudioControl.vue';
import VideoControl from '../VideoControl.vue';
import ManageMemberControl from '../ManageMemberControl.vue';
// import ChatControl from '../ChatControl.vue';
import MasterApplyControl from '../ManageStageControl.vue';
import MemberApplyControl from '../ApplyControl/MemberApplyControl.vue';
import MoreControl from '../MoreControl/index.vue';
import ScreenShareControl from '../ScreenShareControl/Index.vue';
import bus from '../../../hooks/useMitt';

import TUIRoomAegis from '../../../utils/aegis';

import useRoomFooter from './useRoomFooterHooks';

const {
  roomStore,
  isMaster,
  isAdmin,
  isAudience,
} = useRoomFooter();

const showRoomTool = inject('showRoomTool');

function handleControlClick(name: string) {
  TUIRoomAegis.reportEvent({ name, ext1: name });
  bus.emit('experience-communication', name);
}

</script>

<style lang="scss" scoped>
.footer-container{
  width: 750rpx;
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: row;
  background-color: #FBFCFE;
  padding: 12px 12px 20px 12px;
  /* box-shadow: 0px -8px 30px var(--footer-shadow-color); */
}

.footer-hidden {
   bottom: -150px !important;
}
</style>
