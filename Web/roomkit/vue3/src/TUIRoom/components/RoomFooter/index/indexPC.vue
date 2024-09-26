<template>
  <div class="footer-container">
    <div class="left-container">
      <audio-control
        v-if="!isAudience || isAdmin"
        class="left-container-item"
        @click="handleControlClick('audioControl')"
      />
      <video-control
        v-if="!isAudience || isAdmin"
        class="left-container-item"
        @click="handleControlClick('videoControl')"
      />
      <member-apply-control
        v-if="roomStore.isSpeakAfterTakingSeatMode && !isMaster"
        class="left-container-item"
        @click="handleControlClick('MemberApplyControl')"
      />
    </div>
    <div class="center-container">
      <screen-share-control
        class="center-container-item"
        @click="handleControlClick('screenShareControl')"
      />
      <whiteboard-control
        v-if="isElectron"
        class="center-container-item"
        @click="handleControlClick('whiteboard')"
      />
      <full-screen-control
        class="center-container-item"
        @click="handleControlClick('fullScreenControl')"
      />
      <manage-member-control
        class="center-container-item"
        @click="handleControlClick('manageMemberControl')"
      />
      <invite-control
        class="center-container-item"
        @click="handleControlClick('inviteControl')"
      />
      <chat-control
        class="center-container-item"
        @click="handleControlClick('chatControl')"
      />
      <master-apply-control
        v-if="roomStore.isSpeakAfterTakingSeatMode && (isMaster || isAdmin)"
        class="center-container-item"
        @click="handleControlClick('MasterApplyControl')"
      />
      <more-control
        class="center-container-item"
        @click="handleControlClick('moreControl')"
      />
      <AIControl
        class="center-container-item"
        @click="handleControlClick('AIControl')"
        @show-overlay="handleShowOverlay"
      />
      <setting-control
        class="center-container-item"
        @click="handleControlClick('settingControl')"
      />
      <virtual-background class="center-container-item" />
      <basic-beauty v-if="!isElectron" class="center-container-item" />
    </div>
    <div class="right-container">
      <end-control />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import AudioControl from '../AudioControl.vue';
import ScreenShareControl from '../ScreenShareControl/Index.vue';
import FullScreenControl from '../FullScreenControl.vue';
import InviteControl from '../InviteControl.vue';
import VideoControl from '../VideoControl.vue';
import ManageMemberControl from '../ManageMemberControl.vue';
import ChatControl from '../ChatControl.vue';
import MasterApplyControl from '../ManageStageControl.vue';
import MemberApplyControl from '../ApplyControl/MemberApplyControl.vue';
import MoreControl from '../MoreControl';
import EndControl from '../EndControl';
import SettingControl from '../SettingControl.vue';
import WhiteboardControl from '../WhiteboardControl.vue';
import VirtualBackground from '../VirtualBackground.vue';
import AIControl from '../AIControl.vue';
import BasicBeauty from '../BasicBeauty.vue';
import bus from '../../../hooks/useMitt';

import useRoomFooter from './useRoomFooterHooks';
import { isElectron } from '../../../utils/environment';
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
  padding: 0.7rem 0;
  padding-right: 24px;
  padding-left: 9px;
  background-color: var(--background-color-2);
  box-shadow: 0 -8px 30px var(--footer-shadow-color);

  .left-container {
    display: flex;
    align-items: center;
    height: 100%;

    .left-container-item:not(:first-child) {
      margin-left: 1rem;
    }
  }

  .center-container {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
    margin: 0 auto;

    .center-container-item:not(:first-child) {
      margin-left: 16px;
    }
  }

  .right-container {
    display: flex;
    align-items: center;
    height: 100%;
  }
}
</style>
