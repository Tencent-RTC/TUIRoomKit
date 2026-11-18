<template>
  <div class="device-menu">
    <div class="device-menu-title">
    {{ t('Device.Camera') }}
    </div>
    <div v-if="cameraList.length" ref="cameraListRef" class="device-menu-list">
      <button
        v-for="device in cameraList"
        :key="device.deviceId"
        class="device-menu-item"
        :class="{ 'device-menu-item-active': device.deviceId === currentCamera?.deviceId }"
        type="button"
        @click="selectCamera(device.deviceId)"
      >
        <span class="device-menu-name">
          <span class="device-menu-name-text">{{ device.deviceName }}</span>
        </span>
        <IconCheck
          v-if="device.deviceId === currentCamera?.deviceId"
          :size="16"
          class="device-menu-check"
        />
      </button>
    </div>
    <div v-else class="device-menu-empty">
      {{ t('Device.NoCamera') }}
    </div>

    <div class="device-menu-divider" />

    <div class="device-menu-title">
    {{ t('Device.Resolution') }}
    </div>
    <div class="device-menu-list">
      <button
        v-for="option in qualityOptions"
        :key="option.value"
        class="device-menu-item"
        :class="{ 'device-menu-item-active': option.value === localVideoQuality }"
        type="button"
        @click="selectVideoQuality(option.value)"
      >
        <span class="device-menu-name">
          <span class="device-menu-name-text">{{ t(option.labelKey) }}</span>
        </span>
        <IconCheck
          v-if="option.value === localVideoQuality"
          :size="16"
          class="device-menu-check"
        />
      </button>
    </div>

    <div class="device-menu-divider" />

    <div class="device-menu-row">
      <span class="device-menu-label">
        <span>{{ t('Device.Mirror') }}</span>
      </span>
      <TUISwitch
        :model-value="mirrorEnabled"
        size="sm"
        @change="toggleMirror"
      />
    </div>

    <div class="device-menu-divider" />

    <button
      class="device-menu-item"
      type="button"
      @click="emit('open-setting', 'videoEffect')"
    >
      <span class="device-menu-name">
        <span class="device-menu-name-text">{{ t('Settings.TabVideoEffect') }}</span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import {
  MirrorType,
  VideoQuality,
  useDeviceState,
} from 'tuikit-atomicx-vue3/room';
import { IconCheck, TUISwitch, TUIToast, t } from '../../../base';
import type { SettingsTab } from '../../Setting/SettingsDialogPC/SettingsDialogPC.vue';

const emit = defineEmits<{ 'open-setting': [tab: SettingsTab] }>();

/** Same copy as the resolution row in the settings dialog, so both read from one set of keys */
const qualityOptions = [
  { labelKey: 'Settings.Quality1080P', value: VideoQuality.Quality1080P },
  { labelKey: 'Settings.Quality720P', value: VideoQuality.Quality720P },
  { labelKey: 'Settings.Quality540P', value: VideoQuality.Quality540P },
  { labelKey: 'Settings.Quality360P', value: VideoQuality.Quality360P },
];

const cameraListRef = ref<HTMLElement | null>(null);

const {
  cameraList,
  currentCamera,
  localMirrorType,
  localVideoQuality,
  getCameraList,
  setCurrentCamera,
  switchMirror,
  updateVideoQuality,
} = useDeviceState();

const mirrorEnabled = computed(() =>
  localMirrorType.value !== MirrorType.Disable,
);

async function selectCamera(deviceId: string) {
  try {
    await setCurrentCamera({ deviceId });
  } catch {
    TUIToast.error(t('Device.SwitchCamFailed'));
  }
}

async function selectVideoQuality(quality: VideoQuality) {
  try {
    await updateVideoQuality({ quality });
  } catch {
    TUIToast.error(t('Device.SwitchQualityFailed'));
  }
}

async function toggleMirror(enabled: boolean) {
  try {
    await switchMirror({
      mirror: enabled ? MirrorType.Auto : MirrorType.Disable,
    });
  } catch {
    TUIToast.error(t('Device.SwitchMirrorFailed'));
  }
}

onMounted(async () => {
  try {
    await getCameraList();
  } catch {
    TUIToast.error(t('Device.GetCameraListFailed'));
    return;
  }
  await nextTick();
  /** A long list often keeps the current camera below the fold; open with it in view. */
  cameraListRef.value
    ?.querySelector('.device-menu-item-active')
    ?.scrollIntoView({ block: 'nearest' });
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

/* The lists absorb the height the popover cannot give them, so the mirror row and the
   video effect entry stay in view however many cameras are plugged in. The kit hides
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
  flex: none;
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

/* One brand axis for text and background keeps the selected pair in sync
   in every scene (edu green, host custom primaryColor), matching Select/Option */
.device-menu-item-active,
.device-menu-item-active:hover {
  color: var(--rk-brand);
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
  color: var(--rk-brand);
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
  height: 36px;
  padding: 0 12px;
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
</style>
