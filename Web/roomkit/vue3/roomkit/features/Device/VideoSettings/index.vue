<template>
  <div class="video-settings">
    <CameraPreview />

    <div class="video-settings-row">
      <span class="video-settings-row-label">
        <span class="video-settings-row-title">{{ t('Settings.Camera') }}</span>
      </span>
      <span class="video-settings-row-control">
        <TUISelect
          :model-value="currentCamera?.deviceId ?? null"
          size="sm"
          :placeholder="t('Settings.CameraEmpty')"
          :disabled="!cameraList.length"
          :empty-text="t('Settings.CameraEmpty')"
          @change="selectCamera"
        >
          <TUIOption
            v-for="device in cameraList"
            :key="device.deviceId"
            :value="device.deviceId"
            :label="device.deviceName"
          />
        </TUISelect>
      </span>
    </div>

    <div class="video-settings-row">
      <span class="video-settings-row-label">
        <span class="video-settings-row-title">{{ t('Settings.Resolution') }}</span>
        <span class="video-settings-row-description">{{ t('Settings.ResolutionDesc') }}</span>
      </span>
      <span class="video-settings-row-control">
        <TUISelect
          :model-value="localVideoQuality"
          size="sm"
          @change="selectVideoQuality"
        >
          <TUIOption
            v-for="option in QUALITY_OPTIONS"
            :key="option.value"
            :value="option.value"
            :label="t(option.labelKey)"
          />
        </TUISelect>
      </span>
    </div>

    <div class="video-settings-row">
      <span class="video-settings-row-label">
        <span class="video-settings-row-title">{{ t('Settings.Mirror') }}</span>
        <span class="video-settings-row-description">{{ t('Settings.MirrorDesc') }}</span>
      </span>
      <span class="video-settings-row-control">
        <TUISwitch :model-value="mirrorEnabled" @change="toggleMirror" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  MirrorType,
  VideoQuality,
  useDeviceState,
} from 'tuikit-atomicx-vue3/room';
import { TUIOption, TUISelect, TUISwitch, TUIToast, t } from '../../../base';
import CameraPreview from './CameraPreview.vue';

const QUALITY_OPTIONS = [
  { labelKey: 'Settings.Quality1080P', value: VideoQuality.Quality1080P },
  { labelKey: 'Settings.Quality720P', value: VideoQuality.Quality720P },
  { labelKey: 'Settings.Quality540P', value: VideoQuality.Quality540P },
  { labelKey: 'Settings.Quality360P', value: VideoQuality.Quality360P },
];

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

async function selectCamera(deviceId: string | number | null) {
  if (typeof deviceId !== 'string') {
    return;
  }
  try {
    await setCurrentCamera({ deviceId });
  } catch {
    TUIToast.error(t('Settings.CameraFailed'));
  }
}

async function selectVideoQuality(quality: string | number | null) {
  if (typeof quality !== 'number') {
    return;
  }
  try {
    await updateVideoQuality({ quality: quality as VideoQuality });
  } catch {
    TUIToast.error(t('Settings.ResolutionFailed'));
  }
}

async function toggleMirror(enabled: boolean) {
  try {
    await switchMirror({
      mirror: enabled ? MirrorType.Auto : MirrorType.Disable,
    });
  } catch {
    TUIToast.error(t('Settings.MirrorFailed'));
  }
}

onMounted(() => {
  getCameraList().catch(() => TUIToast.error(t('Settings.CameraListFailed')));
});
</script>

<style scoped lang="scss">
.video-settings-row {
  display: flex;
  gap: var(--rk-space-4);
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: var(--rk-space-2) 0;
}

.video-settings-row-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.video-settings-row-title {
  font-size: var(--rk-fs-md);
  color: var(--rk-text-primary);
}

.video-settings-row-description {
  font-size: var(--rk-fs-sm);
  line-height: 1.4;
  color: var(--rk-text-tertiary);
}

.video-settings-row-control {
  display: flex;
  flex: 1 1 120px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  max-width: 240px;
}

.video-settings-row-control :deep(.rk-select) {
  width: 100%;
  min-width: 0;
}

@container settings-dialog (max-width: 560px) {
  .video-settings-row {
    flex-wrap: wrap;
  }

  .video-settings-row-control {
    flex: 1 1 100%;
    max-width: none;
  }
}
</style>
