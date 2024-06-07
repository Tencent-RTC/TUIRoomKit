<template>
  <div class="header" :class="[showRoomTool ? '' : 'header-hidden']">
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
    <switch-theme :visible="false"></switch-theme>
  </div>
</template>
<script setup lang="ts">
import { inject } from 'vue';
import EndControl from '../../RoomFooter/EndControl/index.vue';
import SwitchCamera from './SwitchCamera.vue';
import SwitchMirror from './SwitchMirror.vue';
import RoomInfo from '../RoomInfo/index.vue';
import TUIRoomAegis from '../../../utils/aegis';
import SwitchTheme from '../../common/SwitchTheme.vue';

const emit = defineEmits(['log-out', 'on-destroy-room', 'on-exit-room']);

const showRoomTool = inject('showRoomTool');

const onDestroyRoom = (info: { code: number; message: string }) => {
  emit('on-destroy-room', info);
  TUIRoomAegis.reportEvent({ name: 'destroyRoom', ext1: 'destroyRoom-success' });
};

const onExitRoom = (info: { code: number; message: string }) => {
  emit('on-exit-room', info);
  TUIRoomAegis.reportEvent({ name: 'exitRoom', ext1: 'exitRoom-success' });
};

</script>
<style lang="scss" scoped>
.header {
  width: 750rpx;
  height: 64px;
  position: absolute;
  top: 0;
  left: 0;
  background-color: #FBFCFE;
  box-shadow: 0px 1px 0px #e3eaf7;
  padding: 0 12px;
  display: flex;
}

.header-hidden {
  top: -70px !important;
}

.header-container{
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.icon-box{
  min-width: 50px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
</style>
