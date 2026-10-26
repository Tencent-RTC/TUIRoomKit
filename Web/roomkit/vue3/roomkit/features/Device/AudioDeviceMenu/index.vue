<template>
  <div class="device-menu">
    <div class="device-menu-title">
    {{ t('Device.Microphone') }}
    </div>
    <div v-if="microphoneList.length" ref="microphoneListRef" class="device-menu-list">
      <button
        v-for="device in microphoneList"
        :key="device.deviceId"
        class="device-menu-item"
        :class="{ 'device-menu-item-active': device.deviceId === currentMicrophone?.deviceId }"
        type="button"
        @click="selectMicrophone(device.deviceId)"
      >
        <span class="device-menu-name">
          <span class="device-menu-name-text">{{ device.deviceName }}</span>
        </span>
        <IconCheck
          v-if="device.deviceId === currentMicrophone?.deviceId"
          :size="16"
          class="device-menu-check"
        />
      </button>
    </div>
    <div v-else class="device-menu-empty">
      {{ t('Device.NoMicrophone') }}
    </div>

    <div class="device-menu-level">
      <div class="device-menu-bars" :aria-label="t('Device.MicLevel')">
        <span
          v-for="index in LEVEL_BAR_COUNT"
          :key="index"
          :class="{ 'device-menu-bar-on': index <= activeBarCount }"
        />
      </div>
    </div>

    <div class="device-menu-divider" />

    <div class="device-menu-title">
    {{ t('Device.Speaker') }}
    </div>
    <div v-if="speakerList.length" ref="speakerListRef" class="device-menu-list">
      <button
        v-for="device in speakerList"
        :key="device.deviceId"
        class="device-menu-item"
        :class="{ 'device-menu-item-active': device.deviceId === currentSpeaker?.deviceId }"
        type="button"
        @click="selectSpeaker(device.deviceId)"
      >
        <span class="device-menu-name">
          <span class="device-menu-name-text">{{ device.deviceName }}</span>
        </span>
        <IconCheck
          v-if="device.deviceId === currentSpeaker?.deviceId"
          :size="16"
          class="device-menu-check"
        />
      </button>
    </div>
    <div v-else class="device-menu-empty">
      {{ t('Device.NoSpeaker') }}
    </div>

    <div class="device-menu-row">
      <span class="device-menu-label">
        <span>{{ t('Device.SpeakerTest') }}</span>
        <span class="device-menu-sub">{{ t('Device.SpeakerTestHint') }}</span>
      </span>
      <button
        class="device-menu-test"
        :class="{ 'is-playing': isSpeakerTesting }"
        type="button"
        @click="toggleSpeakerTest"
      >
        {{ isSpeakerTesting ? t('Device.Stop') : t('Device.Test') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconCheck, TUIToast, t } from '../../../base';

const SPEAKER_TEST_URL
  = 'https://web.sdk.qcloud.com/trtc/electron/download/resources/media/TestSpeaker.mp3';
const LEVEL_BAR_COUNT = 16;

const microphoneListRef = ref<HTMLElement | null>(null);
const speakerListRef = ref<HTMLElement | null>(null);

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
  startSpeakerTest,
  stopSpeakerTest,
} = useDeviceState();

/** Device test reports its own volume; the published-mic value is empty before a room. */
const micVolume = computed(() =>
  isMicrophoneTesting.value ? testingMicVolume.value : currentMicVolume.value,
);

const activeBarCount = computed(() => {
  const volume = Math.min(100, Math.max(0, micVolume.value));
  return Math.round((volume / 100) * LEVEL_BAR_COUNT);
});

async function selectMicrophone(deviceId: string) {
  try {
    await setCurrentMicrophone({ deviceId });
  } catch {
    TUIToast.error(t('Device.SwitchMicFailed'));
  }
}

async function selectSpeaker(deviceId: string) {
  try {
    await setCurrentSpeaker({ deviceId });
  } catch {
    TUIToast.error(t('Device.SwitchSpeakerFailed'));
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
    TUIToast.error(t('Device.SpeakerTestFailed'));
  }
}

/** A long list often keeps the current device below the fold; open with it in view. */
function revealCurrentDevice(list: HTMLElement | null) {
  list?.querySelector('.device-menu-item-active')?.scrollIntoView({ block: 'nearest' });
}

onMounted(async () => {
  await Promise.allSettled([getMicrophoneList(), getSpeakerList()]);
  await nextTick();
  revealCurrentDevice(microphoneListRef.value);
  revealCurrentDevice(speakerListRef.value);
});

onBeforeUnmount(() => {
  if (isSpeakerTesting.value) {
    stopSpeakerTest();
  }
});
</script>

<style scoped lang="scss">
/* Fixed width: long device names scroll instead of stretching the menu */
.device-menu {
  display: flex;
  flex-direction: column;
  width: 280px;
  min-height: 0;
  padding: 6px;
}

/* The two lists absorb the height the popover cannot give them, so the level meter and
   the speaker test row stay in view however many devices are plugged in. The kit hides
   every scrollbar at the root and a device list is the one place that needs the
   exception, so a device below the fold is discoverable. No gutter is reserved, so a
   list without overflow keeps full-width, centered rows. */
.device-menu-list {
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: color-mix(in srgb, var(--rk-text-primary) 22%, transparent) transparent;
  scrollbar-width: thin;
}

/* Keep two rows visible when the popover squeezes a long list; short lists (one or two
   devices, e.g. the placeholder entry while permission is blocked) hug their content. */
.device-menu-list:has(.device-menu-item:nth-child(3)) {
  min-height: 72px;
}

.device-menu-list::-webkit-scrollbar {
  display: block;
  width: 6px;
}

.device-menu-list::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--rk-text-primary) 22%, transparent);
  border-radius: var(--rk-radius-pill);
}

.device-menu-list:hover::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--rk-text-primary) 34%, transparent);
}

.device-menu-title {
  flex: none;
  padding: 6px 12px 2px;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  /* Same step as design `--text-3` / `--fg-tertiary` */
  color: var(--rk-text-tertiary);
  letter-spacing: 0.06em;
}

.device-menu-item {
  display: flex;
  gap: 7px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font: inherit;
  font-size: var(--rk-fs-md);
  line-height: 20px;
  color: var(--rk-text-primary);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--rk-radius-md);
}

.device-menu-item:hover {
  background: color-mix(in srgb, var(--rk-text-primary) 5%, transparent);
}

.device-menu-item-active,
.device-menu-item-active:hover {
  color: var(--rk-info);
  background: var(--rk-brand-soft);
}

.device-menu-name {
  container-type: inline-size;
  flex: 1;
  min-width: 0;
  height: 20px;
  overflow: hidden;
  line-height: 20px;
  white-space: nowrap;

  /* Softened right edge stands in for the ellipsis the scrolling text cannot keep */
  mask-image: linear-gradient(to right, #000 calc(100% - 12px), transparent);
}

.device-menu-name-text {
  display: inline-block;
  line-height: 20px;
  white-space: nowrap;
  animation: device-menu-name-scroll 8s ease-in-out infinite;
}

/* min() clamps the shift to 0, so only names wider than their row actually move */
@keyframes device-menu-name-scroll {
  0%,
  15% {
    transform: translateX(0);
  }

  55%,
  70% {
    transform: translateX(min(0px, calc(100cqw - 100%)));
  }

  100% {
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .device-menu-name-text {
    animation: none;
  }
}

.device-menu-check {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--rk-info);
}

.device-menu-empty {
  flex: none;
  padding: 8px 12px;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-disabled);
}

.device-menu-divider {
  flex: none;
  height: 1px;
  margin: 3px 0;
  background: color-mix(in srgb, var(--rk-text-primary) 9%, transparent);
}

.device-menu-row {
  display: flex;
  flex: none;
  gap: 7px;
  align-items: center;
  justify-content: space-between;
  /* Padding-sized like the design row, not a 36px single-line slot */
  min-height: 0;
  padding: 8px 12px;
  font-size: var(--rk-fs-md);
  line-height: 20px;
  color: var(--rk-text-primary);
  border-radius: var(--rk-radius-md);
}

.device-menu-label {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.device-menu-sub {
  font-size: var(--rk-fs-sm);
  line-height: 14px;
  color: var(--rk-text-tertiary);
}

.device-menu-level {
  flex: none;
  padding: 8px 12px 10px;
}

.device-menu-bars {
  display: flex;
  gap: 3px;
  align-items: center;
  height: 8px;
}

/* Bars split the row evenly, so the meter spans the menu at any width */
.device-menu-bars span {
  flex: 1;
  min-width: 0;
  height: 3px;
  background: color-mix(in srgb, var(--rk-text-primary) 9%, transparent);
  border-radius: var(--rk-radius-pill);
}

/* Needs the parent to outweigh the `.device-menu-bars span` base colour */
.device-menu-bars .device-menu-bar-on {
  background: var(--rk-green-500);
}

.device-menu-test {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 18px;
  padding: 0 7px;
  overflow: hidden;
  font-size: var(--rk-fs-xs);
  font-weight: 600;
  line-height: 1;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: color-mix(in srgb, var(--rk-text-primary) 9%, transparent);
  border: 0;
  border-radius: var(--rk-radius-pill);
}

.device-menu-test:hover {
  background: color-mix(in srgb, var(--rk-text-primary) 16%, transparent);
}

/* Playing keeps its accent fill on hover; the label already turned into "stop" */
.device-menu-test.is-playing,
.device-menu-test.is-playing:hover {
  padding-left: 22px;
  color: var(--rk-on-accent);
  background: var(--rk-brand);
}

/* One bar plus two box-shadow copies; the shadows carry the animation */
.device-menu-test.is-playing::before {
  position: absolute;
  top: 50%;
  left: 6px;
  width: 2px;
  height: 8px;
  margin-top: -4px;
  content: '';
  background: currentcolor;
  border-radius: 1px;
  box-shadow: 4px 1px 0 currentcolor, 8px -1px 0 currentcolor;
  animation: device-menu-test-wave 0.55s ease-in-out infinite;
}

@keyframes device-menu-test-wave {
  0%,
  100% {
    box-shadow: 4px 1px 0 currentcolor, 8px -1px 0 currentcolor;
  }

  50% {
    box-shadow: 4px -1px 0 currentcolor, 8px 1px 0 currentcolor;
  }
}

@media (prefers-reduced-motion: reduce) {
  .device-menu-test.is-playing::before {
    animation: none;
  }
}
</style>
