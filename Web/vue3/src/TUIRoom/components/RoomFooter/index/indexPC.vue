<template>
  <div class="footer-container">
    <div class="left-container">
      <audio-control
        v-if="!isAudience || isAdmin"
        class="left-container-item"
        @click="handleControlClick('audioControl')"
      ></audio-control>
      <video-control
        v-if="!isAudience || isAdmin"
        class="left-container-item"
        @click="handleControlClick('videoControl')"
      ></video-control>
      <member-apply-control
        v-if="roomStore.isSpeakAfterTakingSeatMode && !isMaster"
        class="left-container-item"
        @click="handleControlClick('MemberApplyControl')"
      ></member-apply-control>
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
      <master-apply-control
        v-if="roomStore.isSpeakAfterTakingSeatMode && (isMaster || isAdmin)"
        class="center-container-item"
        @click="handleControlClick('MasterApplyControl')"
      ></master-apply-control>
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
import MasterApplyControl from '../ManageStageControl.vue';
import MemberApplyControl from '../ApplyControl/MemberApplyControl.vue';
import MoreControl from '../MoreControl';
import EndControl from '../EndControl';
import SettingControl from '../SettingControl.vue';
import bus from '../../../hooks/useMitt';

import TUIRoomAegis from '../../../utils/aegis';

import useRoomFooter from './useRoomFooterHooks';

const {
  roomStore,
  isMaster,
  isAdmin,
  isAudience,
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
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 0.7rem 0;
  padding-left: 9px;
  padding-right: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: row;
  background-color: var(--background-color-2);
  box-shadow: 0px -8px 30px var(--footer-shadow-color);
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
