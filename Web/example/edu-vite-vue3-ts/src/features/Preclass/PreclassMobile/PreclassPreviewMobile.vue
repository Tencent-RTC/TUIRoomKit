<template>
  <div class="preclass-preview" :class="{ 'is-on': isCameraTesting, 'has-fault': hasCameraError }">
    <div ref="previewRef" class="preclass-preview-view" />
    <div v-if="showAvatar" class="preclass-preview-off">
      <TUIAvatar
        class="preclass-preview-avatar"
        :size="60"
        :src="avatarUrl"
        :alt="userName || t('Preconference.AvatarFallback')"
      />
      <b class="preclass-preview-off-name">{{ userName }}</b>
    </div>
    <div v-if="isCameraTestLoading" class="preclass-preview-loading">
      <TUILoading spinning />
    </div>
    <div v-if="hasCameraError" class="preclass-preview-fault">
      <p class="preclass-preview-fault-title">
        {{ errorTitle }}
      </p>
      <p class="preclass-preview-fault-desc">
        {{ errorDesc }}
      </p>
    </div>
    <button
      v-if="isCameraTesting"
      class="preclass-preview-flip"
      :class="{ 'is-pending': flipPending }"
      type="button"
      :disabled="flipPending"
      :aria-label="t('Device.FlipCamera')"
      @click="flipCamera"
    >
      <IconFlipCamera :size="16" />
    </button>
    <span class="preclass-preview-name">{{ userName || t('Preconference.PreviewFallbackName') }}</span>
    <div class="preclass-preview-controls">
      <button
        class="preclass-preview-control"
        type="button"
        :aria-label="isMicrophoneTesting ? t('Device.MicClose') : t('Device.MicOpen')"
        @click="toggleMicrophone"
      >
        <MicLevelIcon v-if="isMicrophoneTesting" :size="16" />
        <IconMicOff v-else :size="16" />
        <span v-if="hasMicrophoneError" class="preclass-preview-fault-badge" aria-hidden="true">!</span>
      </button>
      <button
        class="preclass-preview-control"
        type="button"
        :disabled="isCameraTestLoading"
        :aria-label="isCameraTesting ? t('Device.CamClose') : t('Device.CamOpen')"
        @click="toggleCamera"
      >
        <IconCam v-if="isCameraTesting" :size="16" />
        <IconCamOff v-else :size="16" />
        <span v-if="hasCameraError" class="preclass-preview-fault-badge" aria-hidden="true">!</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { DeviceError, DeviceType, LoginStatus, MirrorType, useDeviceState, useLoginState } from 'tuikit-atomicx-vue3/room';
import {
  IconCam,
  IconCamOff,
  IconFlipCamera,
  IconMicOff,
  MicLevelIcon,
  TUIAvatar,
  TUILoading,
  t,
  useDeviceFault,
} from '@tencentcloud/roomkit-web-vue3';

const MIC_TEST_INTERVAL = 200;
const FLIP_TIMEOUT_MS = 5000;

const { loginUserInfo, loginStatus } = useLoginState();
const userName = computed(() => loginUserInfo.value?.userName || loginUserInfo.value?.userId || '');
const avatarUrl = computed(() => loginUserInfo.value?.avatarUrl || '');

const previewRef = ref<HTMLDivElement | null>(null);
const flipPending = ref(false);
let flipId = 0;
let lastFrontMirror = MirrorType.Auto;

const {
  isCameraTesting,
  isCameraTestLoading,
  isMicrophoneTesting,
  isFrontCamera,
  cameraLastError,
  microphoneLastError,
  localMirrorType,
  startCameraTest,
  stopCameraTest,
  startMicrophoneTest,
  stopMicrophoneTest,
  switchCamera,
  switchMirror,
} = useDeviceState();
const {
  errorTitle,
  errorDesc,
  cameraFault,
  microphoneFault,
  handleDeviceError,
  clearDeviceFault,
} = useDeviceFault();

const hasCameraError = computed(() => cameraLastError.value !== DeviceError.NoError || !!cameraFault.value);
const hasMicrophoneError = computed(() => microphoneLastError.value !== DeviceError.NoError || !!microphoneFault.value);
const showAvatar = computed(() => !isCameraTesting.value && !isCameraTestLoading.value && !hasCameraError.value);

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
    return;
  }
  startCameraPreview().catch(() => {});
}

function toggleMicrophone() {
  if (isMicrophoneTesting.value) {
    stopMicrophoneTest().catch(() => {});
    return;
  }
  startMicrophonePreview().catch(() => {});
}

/* isFrontCamera updates only after switchCamera resolves. Overlapping taps would
 * all aim the same way and store the back camera's Disable as the front mirror. */
async function flipCamera() {
  if (flipPending.value) {
    return;
  }
  const id = flipId + 1;
  flipId = id;
  flipPending.value = true;
  const timer = setTimeout(() => {
    if (id === flipId) {
      flipPending.value = false;
    }
  }, FLIP_TIMEOUT_MS);
  try {
    const toFront = !isFrontCamera.value;
    if (!toFront) {
      lastFrontMirror = localMirrorType.value;
    }
    await switchCamera({ isFrontCamera: toFront });
    if (id !== flipId) {
      return;
    }
    await switchMirror({ mirror: toFront ? lastFrontMirror : MirrorType.Disable });
  } catch (error) {
    console.error('[PreclassMobile] Failed to switch camera:', error);
  } finally {
    clearTimeout(timer);
    if (id === flipId) {
      flipPending.value = false;
    }
  }
}

let started = false;

async function startDevices() {
  if (started) {
    return;
  }
  started = true;
  await startCameraPreview();
  await startMicrophonePreview();
}

onMounted(() => {
  lastFrontMirror = isFrontCamera.value ? localMirrorType.value : MirrorType.Auto;
  TUIRoomEngine.once('ready', () => {
    startDevices().catch(() => {});
  });
  // Leaving a class remounts this page after the engine is already ready.
  if (loginStatus.value === LoginStatus.LOGINED) {
    startDevices().catch(() => {});
  }
});

onBeforeUnmount(() => {
  stopCameraTest().catch(() => {});
  stopMicrophoneTest().catch(() => {});
});
</script>

<style scoped lang="scss" src="./PreclassPreviewMobile.scss"></style>
