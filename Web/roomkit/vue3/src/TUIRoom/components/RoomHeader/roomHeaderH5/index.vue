<template>
  <div class="header">
    <div class="header-container">
      <div class="icon-box">
        <switch-camera />
        <switch-mirror />
      </div>
      <room-info class="room-info" />
      <end-control />
    </div>
    <switch-theme :visible="false" />
  </div>
</template>
<script setup lang="ts">
import EndControl from '../../RoomFooter/EndControl';
import SwitchCamera from './SwitchCamera.vue';
import SwitchMirror from './SwitchMirror.vue';
import RoomInfo from '../RoomInfo';
import SwitchTheme from '../../common/SwitchTheme.vue';
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
  align-items: center;
  justify-content: space-between;
  min-width: 50px;
}

.room-info {
  overflow: auto;
}
</style>
