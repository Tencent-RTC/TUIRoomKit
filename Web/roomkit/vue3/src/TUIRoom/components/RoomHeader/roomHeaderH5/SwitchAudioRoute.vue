<template>
  <div class="audio-route-icon">
    <svg-icon v-tap="handleSwitchAudioRoute" :icon="icon" />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { TUIAudioRoute } from '@tencentcloud/tuiroom-engine-js';
import SvgIcon from '../../common/base/SvgIcon.vue';
import SpeakerPhoneIcon from '../../common/icons/SpeakerPhoneIcon.vue';
import EarpieceIcon from '../../common/icons/EarpieceIcon.vue';
import vTap from '../../../directives/vTap';
import { useAudioDeviceState } from '../../../core';

const { currentAudioRoute, speaker } = useAudioDeviceState();

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
  await speaker.setAudioRoute({
    route: audioRoute,
  });
}
</script>
<style lang="scss" scoped>
.audio-route-icon {
  display: flex;
  background-size: cover;
}
</style>
