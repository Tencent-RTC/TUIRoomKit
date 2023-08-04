<template>
  <div class="mirror-container">
    <svg-icon class="mirror-icon" icon-name="mirror" @click="toogleMirrorStatus"></svg-icon>
  </div>
</template>
<script setup lang="ts">
import SvgIcon from '../../common/SvgIcon.vue';
import { useBasicStore } from '../../../stores/basic';

import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { TRTCVideoMirrorType, TRTCVideoRotation, TRTCVideoFillMode } from '@tencentcloud/tuiroom-engine-wx';
const roomEngine = useGetRoomEngine();
const basicStore = useBasicStore();

function toogleMirrorStatus() {
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  trtcCloud?.setLocalRenderParams({
    mirrorType:
      basicStore.isLocalStreamMirror
        ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
    rotation: TRTCVideoRotation.TRTCVideoRotation0,
    fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
  });
  basicStore.setIsLocalStreamMirror(basicStore.isLocalStreamMirror);
  basicStore.isLocalStreamMirror = !basicStore.isLocalStreamMirror;
}

</script>
<style lang="scss" scoped>
  .mirror-icon{
    width: 16px;
    height: 16px;
    background-size: cover;
  }
</style>
