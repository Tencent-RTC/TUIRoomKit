<template>
  <div class="mirror-icon">
    <svg-icon
      style="display: flex"
      @tap="toogleMirrorStatus"
      :icon="MirrorIcon"
      :custom-style="{ backgroundSize: '50%' }"
    />
  </div>
</template>
<script setup lang="ts">
import SvgIcon from '../../common/base/SvgIcon.vue';
import { useBasicStore } from '../../../stores/basic';
import MirrorIcon from '../../../assets/icons/MirrorIcon.svg';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import {
  TRTCVideoMirrorType,
  TRTCVideoRotation,
  TRTCVideoFillMode,
} from '@tencentcloud/tuiroom-engine-wx';
const roomEngine = useGetRoomEngine();
const basicStore = useBasicStore();

function toogleMirrorStatus() {
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  trtcCloud?.setLocalRenderParams({
    mirrorType: basicStore.isLocalStreamMirror
      ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
      : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
    rotation: TRTCVideoRotation.TRTCVideoRotation0,
    fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
  });
  basicStore.setIsLocalStreamMirror(basicStore.isLocalStreamMirror);
  basicStore.isLocalStreamMirror = !basicStore.isLocalStreamMirror;
}
</script>
<style lang="scss" scoped>
.mirror-icon {
  display: flex;
}
</style>
