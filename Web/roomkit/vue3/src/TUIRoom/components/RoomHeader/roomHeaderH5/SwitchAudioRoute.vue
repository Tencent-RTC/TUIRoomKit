<template>
  <div class="audio-route-icon">
    <TUIIcon v-tap="handleSwitchAudioRoute" :icon="icon" size="20" />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { TUIAudioRoute } from '@tencentcloud/tuiroom-engine-js';
import {
  TUIIcon,
  IconSpeakerPhone,
  IconEarpiece,
} from '@tencentcloud/uikit-base-component-vue3';
import vTap from '../../../directives/vTap';
import { useAudioDeviceState } from '../../../core';

const { currentAudioRoute, speaker } = useAudioDeviceState();

const icon = computed(() =>
  currentAudioRoute.value === TUIAudioRoute.kAudioRouteSpeakerphone
    ? IconSpeakerPhone
    : IconEarpiece
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
