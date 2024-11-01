<template>
  <div class="audio-route-icon">
    <svg-icon
      style="display: flex"
      @tap="handleSwitchAudioRoute"
      :icon="icon"
    />
  </div>
</template>
<script setup lang="ts">
import useDeviceManager from '../../../hooks/useDeviceManager';
import SvgIcon from '../../common/base/SvgIcon.vue';
import SpeakerPhoneIcon from '../../../assets/icons/SpeakerPhoneIcon.svg';
import EarpieceIcon from '../../../assets/icons/EarpieceIcon.svg';
import { TUIAudioRoute } from '@tencentcloud/tuiroom-engine-wx';
import { computed, ref } from 'vue';
const { deviceManager } = useDeviceManager();
const currentAudioRoute = ref<TUIAudioRoute>(
  TUIAudioRoute.kAudioRouteSpeakerphone
);

const icon = computed(() =>
  currentAudioRoute.value === TUIAudioRoute.kAudioRouteSpeakerphone
    ? SpeakerPhoneIcon
    : EarpieceIcon
);

async function handleSwitchAudioRoute() {
  const audioRoute =
    currentAudioRoute.value === TUIAudioRoute.kAudioRouteSpeakerphone
      ? TUIAudioRoute.kAudioRouteEarpiece
      : TUIAudioRoute.kAudioRouteSpeakerphone;
  await deviceManager.instance?.setAudioRoute({
    route: audioRoute,
  });
  currentAudioRoute.value = audioRoute;
}
</script>
<style lang="scss" scoped>
.audio-route-icon {
  display: flex;
  background-size: cover;
}
</style>
