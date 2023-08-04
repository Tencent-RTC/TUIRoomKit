<template>
  <div class="header-container">
    <div class="icon-box">
      <switch-camera />
      <switch-mirror />
    </div>
    <room-info />
    <end-control
      @on-destroy-room="onDestroyRoom"
      @on-exit-room="onExitRoom"
    />
  </div>
</template>
<script setup lang="ts">
import EndControl from '../../RoomFooter/EndControl/EndControlWX.vue';
import SwitchCamera from './SwitchCamera.vue';
import SwitchMirror from './SwitchMirror.vue';
import RoomInfo from './RoomInfo.vue';
import TUIRoomAegis from '../../../utils/aegis';

const emit = defineEmits(['log-out', 'on-destroy-room', 'on-exit-room']);

const onDestroyRoom = (info: { code: number; message: string }) => {
  emit('on-destroy-room', info);
  TUIRoomAegis.reportEvent({ name: 'destroyRoom', ext1: 'destroyRoom-success' });
};

const onExitRoom = (info: { code: number; message: string }) => {
  emit('on-exit-room', info);
  TUIRoomAegis.reportEvent({ name: 'exitRoom', ext1: 'exitRoom-success' });
};

</script>
<style scoped>
.header-container{
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 10px;
}
.icon-box{
   min-width: 50px;
   display: flex;
   align-items: center;
   justify-content: space-between
}
</style>
