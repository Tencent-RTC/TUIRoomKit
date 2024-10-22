<template>
  <div class="header">
    <div class="header-container">
      <div class="icon-box">
        <switch-camera />
        <switch-mirror />
        <switch-audio-route v-if="isWeChat" />
      </div>
      <room-info class="room-info" />
      <end-control />
    </div>
    <switch-theme :visible="false" />
  </div>
</template>
<script setup lang="ts">
import EndControl from '../../RoomFooter/EndControl/index.vue';
import SwitchCamera from './SwitchCamera.vue';
import SwitchMirror from './SwitchMirror.vue';
import SwitchAudioRoute from './SwitchAudioRoute.vue';
import RoomInfo from '../RoomInfo/index.vue';
import SwitchTheme from '../../common/SwitchTheme.vue';
import { isWeChat } from '../../../utils/environment';
</script>
<style scoped>
.header {
  height: 100%;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 12px;
}

.icon-box {
  display: flex;
  gap: 10px;
  align-items: center;
}

.room-info {
  overflow: auto;
}
</style>
