<template>
  <div class="mirror-icon">
    <svg-icon
      @tap="toogleMirrorStatus" icon-name="mirror" size="custom"
      :custom-style="{backgroundSize: '50%'}"
    ></svg-icon>
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
    display: block;
    width: 32px;
    height: 32px;
  }
</style>
