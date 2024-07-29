<template>
  <div class="header">
    <div class="header-container">
      <div class="icon-box">
        <switch-camera />
        <switch-mirror />
      </div>
      <room-info />
      <end-control />
    </div>
    <switch-theme :visible="false"></switch-theme>
  </div>
</template>
<script setup lang="ts">
import EndControl from '../../RoomFooter/EndControl/index.vue';
import SwitchCamera from './SwitchCamera.vue';
import SwitchMirror from './SwitchMirror.vue';
import RoomInfo from '../RoomInfo/index.vue';
import SwitchTheme from '../../common/SwitchTheme.vue';

</script>
<style scoped>
.header{
  height: 100%
}
.header-container{
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding:0 12px;
}
.icon-box{
   min-width: 50px;
   display: flex;
   align-items: center;
   justify-content: space-between
}
</style>
