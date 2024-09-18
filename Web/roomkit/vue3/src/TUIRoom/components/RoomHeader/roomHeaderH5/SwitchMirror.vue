<template>
  <div class="mirror-icon">
    <svg-icon
      v-tap="toogleMirrorStatus"
      :icon="MirrorIcon"
      :custom-style="{ backgroundSize: '50%' }"
    />
  </div>
</template>
<script setup lang="ts">
import SvgIcon from '../../common/base/SvgIcon.vue';
import { useBasicStore } from '../../../stores/basic';
import MirrorIcon from '../../common/icons/MirrorIcon.vue';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import {
  TRTCVideoMirrorType,
  TRTCVideoRotation,
  TRTCVideoFillMode,
} from '@tencentcloud/tuiroom-engine-js';
import vTap from '../../../directives/vTap';
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
