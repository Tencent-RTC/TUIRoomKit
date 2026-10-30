<template>
  <div class="local-preview" :class="{ 'has-fault-overlay': hasCameraError }">
    <div
      class="video-preview"
      :aria-label="t('Preconference.PreviewCameraArea')"
    >
      <div
        ref="previewRef"
        class="video-preview-view"
      />
      <div v-if="!isCameraTesting && !isCameraTestLoading && !hasCameraError" class="video-placeholder">
        <div class="avatar-frame">
          <TUIAvatar
            class="preview-avatar"
            :size="96"
            :src="avatarUrl"
            :alt="userName || t('Preconference.AvatarFallback')"
          />
        </div>
        <div class="video-off-info">
          <strong class="video-off-name">{{
            userName || t('Preconference.PreviewFallbackName')
          }}</strong>
          <span class="video-off-hint">
            <IconCamOff :size="11" />{{ t('Preconference.CameraOff') }}
          </span>
        </div>
      </div>
      <div v-if="isCameraTestLoading" class="video-preview-loading">
        <TUILoading spinning />
      </div>
      <div v-if="hasCameraError" class="preview-fault-overlay">
        <div class="preview-fault-overlay-icon">
          <IconAlertCircle :size="20" />
        </div>
        <div class="preview-fault-overlay-title">
          {{ errorTitle }}
        </div>
        <div class="preview-fault-overlay-desc">
          {{ errorDesc }}
        </div>
      </div>
      <div class="name-tag">
        {{ userName || t('Preconference.PreviewFallbackName') }}
      </div>
      <button
        class="video-fx-hint"
        type="button"
        @click="openSettings('videoEffect')"
      >
        <IconImage :size="12" />
        <span>{{ t('Settings.TabVideoEffect') }}</span>
      </button>
    </div>

    <div class="media-controls">
      <div
        class="media-btn"
        :class="{
          'is-off': !isMicrophoneTesting,
        }"
      >
        <button
          class="media-btn-icon"
          type="button"
          :aria-label="isMicrophoneTesting ? t('Device.MicClose') : t('Device.MicOpen')"
          @click="toggleMicrophone"
        >
          <span class="media-btn-icon-wrap">
            <MicLevelIcon v-if="isMicrophoneTesting" :size="20" />
            <IconMicOff v-else :size="20" />
            <span v-if="hasMicrophoneError" class="media-btn-badge" aria-hidden="true">!</span>
          </span>
        </button>
        <i class="media-btn-divider" />
        <TUIPopover
          v-model:open="micMenuOpen"
          placement="top"
          :offset="8"
          :padded="false"
        >
          <button
            class="media-btn-caret"
            type="button"
            :class="{ 'is-open': micMenuOpen }"
            :aria-label="t('Device.MicSettings')"
            :aria-expanded="micMenuOpen"
          >
            <IconChevronUp :size="12" />
          </button>
          <template #content>
            <AudioDeviceMenu />
          </template>
        </TUIPopover>
      </div>

      <div
        class="media-btn"
        :class="{
          'is-off': !isCameraTesting,
        }"
      >
        <button
          class="media-btn-icon"
          type="button"
          :aria-label="isCameraTesting ? t('Device.CamClose') : t('Device.CamOpen')"
          :disabled="isCameraTestLoading"
          @click="toggleCamera"
        >
          <span class="media-btn-icon-wrap">
            <IconCam v-if="isCameraTesting" :size="20" />
            <IconCamOff v-else :size="20" />
            <span v-if="hasCameraError" class="media-btn-badge" aria-hidden="true">!</span>
          </span>
        </button>
        <i class="media-btn-divider" />
        <TUIPopover
          v-model:open="camMenuOpen"
          placement="top"
          :offset="8"
          :padded="false"
        >
          <button
            class="media-btn-caret"
            type="button"
            :class="{ 'is-open': camMenuOpen }"
            :aria-label="t('Device.VideoSettings')"
            :aria-expanded="camMenuOpen"
          >
            <IconChevronUp :size="12" />
          </button>
          <template #content>
            <VideoDeviceMenu @open-setting="leaveForSetting" />
          </template>
        </TUIPopover>
      </div>
    </div>

    <SettingsDialogPC
      :open="settingsOpen"
      :active-tab="settingsTab"
      @select="settingsTab = $event"
      @close="handleSettingsClose"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import { DeviceError, DeviceType, useDeviceState } from 'tuikit-atomicx-vue3/room';
import {
  IconAlertCircle,
  IconCam,
  IconCamOff,
  IconChevronUp,
  IconImage,
  IconMicOff,
  AudioDeviceMenu,
  MicLevelIcon,
  SettingsDialogPC,
  TUIAvatar,
  TUILoading,
  TUIPopover,
  VideoDeviceMenu,
  checkInsecureContext,
  t,
  useDeviceFault,
} from '@tencentcloud/roomkit-web-vue3';
import type { SettingsTab } from '@tencentcloud/roomkit-web-vue3';

const MIC_TEST_INTERVAL = 200;

const { loginUserInfo } = useLoginState();
const userName = computed(() =>
  loginUserInfo.value?.userName || loginUserInfo.value?.userId || '',
);
const avatarUrl = computed(() => loginUserInfo.value?.avatarUrl || '');
const emit = defineEmits<{
  bannerChange: [key: string | undefined];
}>();
const micMenuOpen = ref(false);
const camMenuOpen = ref(false);
const previewRef = ref<HTMLDivElement | null>(null);
const settingsOpen = ref(false);
const settingsTab = ref<SettingsTab>('videoEffect');
const {
  isCameraTesting,
  isCameraTestLoading,
  isMicrophoneTesting,
  cameraLastError,
  microphoneLastError,
  startCameraTest,
  stopCameraTest,
  startMicrophoneTest,
  stopMicrophoneTest,
} = useDeviceState();
const {
  errorTitle,
  errorDesc,
  cameraFault,
  microphoneFault,
  handleDeviceError,
  clearDeviceFault,
} = useDeviceFault();
const hasCameraError = computed(() =>
  cameraLastError.value !== DeviceError.NoError || !!cameraFault.value,
);
const hasMicrophoneError = computed(() =>
  microphoneLastError.value !== DeviceError.NoError || !!microphoneFault.value,
);

async function startCameraPreview() {
  try {
    await nextTick();
    if (!previewRef.value) {
      return;
    }
    await startCameraTest({ view: previewRef.value });
    clearDeviceFault(DeviceType.Camera);
  } catch (error) {
    await handleDeviceError(DeviceType.Camera, error);
  }
}

async function startMicrophonePreview() {
  try {
    await startMicrophoneTest({ interval: MIC_TEST_INTERVAL });
    clearDeviceFault(DeviceType.Microphone);
  } catch (error) {
    await handleDeviceError(DeviceType.Microphone, error);
  }
}

function toggleCamera() {
  if (isCameraTestLoading.value) {
    return;
  }
  if (isCameraTesting.value) {
    stopCameraTest().catch(() => {});
  } else {
    startCameraPreview().catch(() => {});
  }
}

function toggleMicrophone() {
  if (isMicrophoneTesting.value) {
    stopMicrophoneTest().catch(() => {});
  } else {
    startMicrophonePreview().catch(() => {});
  }
}

// Snapshot at open time: at close-handler time the panel's own test stream is
// still running, so isCameraTesting there cannot tell this fact apart.
let cameraOnBeforeSettings = false;

function openSettings(tab: SettingsTab = 'videoEffect') {
  cameraOnBeforeSettings = isCameraTesting.value;
  settingsTab.value = tab;
  settingsOpen.value = true;
}

function handleSettingsClose() {
  settingsOpen.value = false;
  // Respect the camera state the user had before opening the panel: a camera
  // that was off started the panel's own test stream and stops with it.
  if (!cameraOnBeforeSettings) {
    return;
  }
  // The effect panel borrowed the shared camera test's render view; the
  // stream is still ours, take the view back.
  startCameraPreview().catch(() => {});
}

onMounted(() => {
  emit('bannerChange', checkInsecureContext() ? 'Device.Fault.InsecureBanner' : undefined);
  TUIRoomEngine.once('ready', () => {
    startCameraPreview().catch(() => {});
    startMicrophonePreview().catch(() => {});
  });
});

onBeforeUnmount(() => {
  stopCameraTest().catch(() => {});
  stopMicrophoneTest().catch(() => {});
});

function leaveForSetting(tab: SettingsTab) {
  camMenuOpen.value = false;
  openSettings(tab);
}
</script>

<style scoped lang="scss">
.local-preview {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  min-height: 0;
}

.video-preview {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  overflow: hidden;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 20px;
}

.video-preview-view {
  position: absolute;
  inset: 0;
}

.video-preview-view :deep(video) {
  width: calc(100% + 2px) !important;
  height: calc(100% + 2px) !important;
  margin: -1px !important;
}

.video-preview-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--rk-bg-surface) 72%, transparent);
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.avatar-frame {
  position: relative;
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
}

.avatar-frame::before,
.avatar-frame::after {
  position: absolute;
  border: 1px solid var(--rk-border);
  border-radius: 50%;
  content: '';
}

.avatar-frame::before {
  inset: -14px;
  opacity: 0.5;
}

.avatar-frame::after {
  inset: -28px;
  opacity: 0.25;
}

.preview-avatar {
  position: relative;
  z-index: 1;
}

.video-off-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.video-off-name {
  font-size: var(--rk-fs-lg);
  font-weight: 500;
}

.video-off-hint {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 5px 12px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  color: var(--rk-text-secondary);
  background: color-mix(in srgb, #1c1b1c 6%, transparent);
  border: 1px solid var(--rk-border);
  border-radius: var(--rk-radius-pill);
}

.video-off-hint :deep(.rk-ico-slash) {
  stroke: var(--rk-text-tertiary);
}

.name-tag {
  position: absolute;
  bottom: 14px;
  left: 14px;
  z-index: 8;
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  backdrop-filter: blur(16px);
  border-radius: var(--rk-radius-pill);
}

.video-fx-hint {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 8;
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px 6px 8px;
  font: inherit;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  background: rgb(0 0 0 / 55%);
  backdrop-filter: blur(16px);
  border: 1px solid var(--rk-border);
  border-radius: var(--rk-radius-pill);
}

.video-fx-hint:hover {
  background: rgb(0 0 0 / 68%);
}

.media-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 4px;
}

.media-btn {
  display: flex;
  align-items: center;
  height: 52px;
  padding-right: 6px;
  color: var(--rk-text-primary);
  background: rgba(70, 100, 150, 0.04);
  border-radius: var(--rk-radius-pill);
}

.media-btn:hover {
  background: rgba(70, 100, 150, 0.075);
}

:global(.rk-root[data-rk-theme='dark'] .media-btn) {
  background: rgba(140, 170, 230, 0.035);
}

:global(.rk-root[data-rk-theme='dark'] .media-btn:hover) {
  background: rgba(140, 170, 230, 0.07);
}

.media-btn-icon,
.media-btn-caret {
  display: grid;
  place-items: center;
  padding: 0;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.media-btn-icon {
  position: relative;
  width: 44px;
  height: 44px;
  margin-left: 4px;
}

.media-btn-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.media-btn-icon:disabled,
.media-btn-caret:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.media-btn-divider {
  width: 1px;
  height: 22px;
  background: var(--rk-border-strong);
  opacity: 0.5;
}

.media-btn-caret {
  width: 32px;
  height: 44px;
  color: var(--rk-text-secondary);
  transition: color 0.12s, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.media-btn-caret:hover {
  color: var(--rk-text-primary);
}

.media-btn-caret.is-open {
  transform: rotate(180deg);
}

.media-btn-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  color: #000;
  pointer-events: none;
  background: var(--rk-warning);
  border: 1.5px solid var(--rk-bg-surface);
  border-radius: 50%;
}

.preview-fault-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  text-align: center;
  background: var(--rk-bg-device-fault);
}

.preview-fault-overlay-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 4px;
  color: var(--rk-text-primary);
  background: color-mix(in srgb, #16192a 5%, transparent);
  border: 1px solid color-mix(in srgb, #16192a 10%, transparent);
  border-radius: 14px;
}

.preview-fault-overlay-title {
  font-size: var(--rk-fs-lg);
  font-weight: 600;
  color: var(--rk-text-primary);
}

.preview-fault-overlay-desc {
  max-width: 300px;
  font-size: var(--rk-fs-sm);
  line-height: 1.55;
  color: var(--rk-text-secondary);
}

:global(.rk-root[data-rk-theme='dark'] .local-preview .preview-fault-overlay) {
  background: var(--rk-bg-camera-off);
}

:global(.rk-root[data-rk-theme='dark'] .local-preview.has-fault-overlay .video-preview) {
  background: var(--rk-bg-camera-off);
}

:global(.rk-root[data-rk-theme='dark'] .local-preview .preview-fault-overlay-icon) {
  color: var(--rk-text-primary);
  background: var(--rk-border);
  border-color: var(--rk-border-strong);
}

:global(.rk-root[data-rk-theme='dark'] .local-preview .preview-fault-overlay-title) {
  color: var(--rk-text-primary);
}

:global(.rk-root[data-rk-theme='dark'] .local-preview .preview-fault-overlay-desc) {
  color: var(--rk-text-secondary);
}

</style>
