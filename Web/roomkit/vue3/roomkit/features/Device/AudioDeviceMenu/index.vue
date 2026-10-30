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
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconCheck, TUIToast, t } from '../../../base';

const microphoneListRef = ref<HTMLElement | null>(null);
const speakerListRef = ref<HTMLElement | null>(null);

const {
  microphoneList,
  currentMicrophone,
  speakerList,
  currentSpeaker,
  getMicrophoneList,
  getSpeakerList,
  setCurrentMicrophone,
  setCurrentSpeaker,
} = useDeviceState();

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
</style>
