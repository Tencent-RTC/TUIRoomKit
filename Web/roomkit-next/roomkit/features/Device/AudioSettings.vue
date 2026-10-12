<template>
  <div class="audio-settings">
    <div class="audio-settings-group-title">{{ t('Settings.AudioInput') }}</div>

    <div class="audio-settings-row">
      <span class="audio-settings-row-title">{{ t('Settings.Microphone') }}</span>
      <span class="audio-settings-row-control">
        <TUISelect
          :model-value="currentMicrophone?.deviceId ?? null"
          size="sm"
          :placeholder="t('Settings.MicrophoneEmpty')"
          :disabled="!microphoneList.length"
          :empty-text="t('Settings.MicrophoneEmpty')"
          @change="selectMicrophone"
        >
          <TUIOption
            v-for="device in microphoneList"
            :key="device.deviceId"
            :value="device.deviceId"
            :label="device.deviceName"
          />
        </TUISelect>
      </span>
    </div>

    <div class="audio-settings-row">
      <span class="audio-settings-row-title">{{ t('Settings.MicLevel') }}</span>
      <span class="audio-settings-row-control">
        <div class="audio-settings-level" :aria-label="t('Settings.MicLevelMeter')">
          <span
            v-for="index in LEVEL_BAR_COUNT"
            :key="index"
            :class="{ 'is-on': index <= activeBarCount }"
          />
        </div>
      </span>
    </div>

    <div class="audio-settings-group-title">{{ t('Settings.AudioOutput') }}</div>

    <div class="audio-settings-row">
      <span class="audio-settings-row-title">{{ t('Settings.Speaker') }}</span>
      <span class="audio-settings-row-control">
        <TUISelect
          :model-value="currentSpeaker?.deviceId ?? null"
          size="sm"
          :placeholder="t('Settings.SpeakerEmpty')"
          :disabled="!speakerList.length"
          :empty-text="t('Settings.SpeakerEmpty')"
          @change="selectSpeaker"
        >
          <TUIOption
            v-for="device in speakerList"
            :key="device.deviceId"
            :value="device.deviceId"
            :label="device.deviceName"
          />
        </TUISelect>
      </span>
    </div>

    <div class="audio-settings-row is-inline">
      <span class="audio-settings-row-title">{{ t('Settings.SpeakerTest') }}</span>
      <span class="audio-settings-row-control">
        <button
          class="audio-settings-test"
          :class="{ 'is-playing': isSpeakerTesting }"
          type="button"
          @click="toggleSpeakerTest"
        >
          {{ isSpeakerTesting ? t('Settings.SpeakerTestStop') : t('Settings.SpeakerTestStart') }}
        </button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
import { TUIOption, TUISelect, TUIToast } from '../../base';
import { t } from '../../i18n';

const SPEAKER_TEST_URL
  = 'https://web.sdk.qcloud.com/trtc/electron/download/resources/media/TestSpeaker.mp3';
const LEVEL_BAR_COUNT = 30;
const MIC_TEST_INTERVAL = 200;

const {
  microphoneList,
  currentMicrophone,
  currentMicVolume,
  testingMicVolume,
  isMicrophoneTesting,
  speakerList,
  currentSpeaker,
  isSpeakerTesting,
  getMicrophoneList,
  getSpeakerList,
  setCurrentMicrophone,
  setCurrentSpeaker,
  startMicrophoneTest,
  stopMicrophoneTest,
  startSpeakerTest,
  stopSpeakerTest,
} = useDeviceState();

/** The device test reports its own volume; the room's value only covers a published mic. */
const micVolume = computed(() =>
  isMicrophoneTesting.value ? testingMicVolume.value : currentMicVolume.value,
);

const activeBarCount = computed(() => {
  const volume = Math.min(100, Math.max(0, micVolume.value));
  return Math.round((volume / 100) * LEVEL_BAR_COUNT);
});

async function selectMicrophone(deviceId: string | number | null) {
  if (typeof deviceId !== 'string') {
    return;
  }
  try {
    await setCurrentMicrophone({ deviceId });
  } catch {
    TUIToast.error(t('Settings.MicrophoneFailed'));
  }
}

async function selectSpeaker(deviceId: string | number | null) {
  if (typeof deviceId !== 'string') {
    return;
  }
  try {
    await setCurrentSpeaker({ deviceId });
  } catch {
    TUIToast.error(t('Settings.SpeakerFailed'));
  }
}

async function toggleSpeakerTest() {
  try {
    if (isSpeakerTesting.value) {
      await stopSpeakerTest();
      return;
    }
    await startSpeakerTest({ filePath: SPEAKER_TEST_URL });
  } catch {
    TUIToast.error(t('Settings.SpeakerTestFailed'));
  }
}

onMounted(() => {
  Promise.allSettled([getMicrophoneList(), getSpeakerList()]);
  // A blocked or missing microphone already shows up in the device list and its
  // error state, so a failed test leaves the meter flat instead of raising a toast.
  startMicrophoneTest({ interval: MIC_TEST_INTERVAL }).catch(() => {});
});

onBeforeUnmount(() => {
  if (isMicrophoneTesting.value) {
    stopMicrophoneTest();
  }
  if (isSpeakerTesting.value) {
    stopSpeakerTest();
  }
});
</script>

<style scoped lang="scss">
.audio-settings-group-title {
  padding: var(--rk-space-3) 0 var(--rk-space-1);
  font-size: 11px;
  font-weight: 600;
  color: var(--rk-text-tertiary);
  letter-spacing: 0.06em;
}

.audio-settings-group-title:first-child {
  padding-top: 0;
}

/* Every group but the first is fenced off by a hairline above its title. */
.audio-settings-group-title:not(:first-child) {
  padding-top: 20px;
  margin-top: 16px;
  border-top: 1px solid var(--rk-border);
}

.audio-settings-row {
  display: flex;
  gap: var(--rk-space-4);
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: var(--rk-space-2) 0;
}

.audio-settings-row-title {
  min-width: 0;
  font-size: 13px;
  color: var(--rk-text-primary);
}

.audio-settings-row-control {
  display: flex;
  flex: 1 1 120px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  max-width: 240px;
}

.audio-settings-row-control :deep(.rk-select) {
  width: 100%;
  min-width: 0;
}

.audio-settings-level {
  display: flex;
  gap: 3px;
  align-items: center;
  width: 100%;
  height: 8px;
}

.audio-settings-level span {
  flex: 1;
  height: 3px;
  background: var(--rk-bg-hover);
  border-radius: var(--rk-radius-pill);
}

.audio-settings-level .is-on {
  background: var(--rk-success);
}

.audio-settings-test {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 26px;
  padding: 0 var(--rk-space-3);
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: var(--rk-bg-muted);
  border: 0;
  border-radius: var(--rk-radius-pill);
}

.audio-settings-test:hover {
  background: var(--rk-bg-hover);
}

/* Playing keeps its accent fill on hover; the label already turned into "stop" */
.audio-settings-test.is-playing,
.audio-settings-test.is-playing:hover {
  padding-left: 28px;
  color: var(--rk-on-accent);
  background: var(--rk-brand);
}

/* One bar plus two box-shadow copies; the shadows carry the animation */
.audio-settings-test.is-playing::before {
  position: absolute;
  top: 50%;
  left: 10px;
  width: 3px;
  height: 12px;
  margin-top: -6px;
  content: '';
  background: currentcolor;
  border-radius: 1px;
  box-shadow: 5px 1px 0 currentcolor, 10px -1px 0 currentcolor;
  animation: audio-settings-test-wave 0.55s ease-in-out infinite;
}

@keyframes audio-settings-test-wave {
  0%,
  100% {
    box-shadow: 5px 1px 0 currentcolor, 10px -1px 0 currentcolor;
  }

  50% {
    box-shadow: 5px -1px 0 currentcolor, 10px 1px 0 currentcolor;
  }
}

@media (prefers-reduced-motion: reduce) {
  .audio-settings-test.is-playing::before {
    animation: none;
  }
}

@container settings-dialog (max-width: 560px) {
  .audio-settings-row {
    flex-wrap: wrap;
  }

  .audio-settings-row-control {
    flex: 1 1 100%;
    max-width: none;
  }

  /* Only controls that need the width drop below their label; a button fits beside it. */
  .audio-settings-row.is-inline .audio-settings-row-control {
    flex: 0 0 auto;
  }
}
</style>
