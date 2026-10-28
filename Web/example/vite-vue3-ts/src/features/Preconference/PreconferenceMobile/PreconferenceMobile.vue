<template>
  <div class="preconference-mobile">
    <header class="pre-topbar">
      <div
        class="pre-profile"
        role="button"
        tabindex="0"
        aria-haspopup="dialog"
        :aria-label="displayUserName || t('Preconference.AvatarFallback')"
        :aria-expanded="profileOpen"
        @click="profileOpen = !profileOpen"
        @keydown.enter.prevent="profileOpen = !profileOpen"
        @keydown.space.prevent="profileOpen = !profileOpen"
      >
        <span class="pre-avatar-btn">
          <TUIAvatar
            :size="32"
            :src="displayAvatarUrl"
            :alt="displayUserName || t('Preconference.AvatarFallback')"
          />
        </span>
        <h2 class="pre-user-name" :title="displayUserName">
          {{ displayUserName }}
        </h2>
      </div>
    </header>

    <div class="pre-body">
      <div
        class="pre-preview"
        :class="{ 'is-on': isCameraTesting }"
        :aria-label="t('Preconference.PreviewRegion')"
      >
        <div v-show="!isCameraTesting" class="pre-preview-avatar">
          <TUIAvatar
            :size="56"
            :src="displayAvatarUrl"
            :alt="displayUserName || t('Preconference.AvatarFallback')"
          />
        </div>
        <div v-show="showVideo" ref="previewRef" class="pre-preview-video" />
        <button
          v-if="isCameraTesting"
          type="button"
          class="pre-flip-camera"
          :aria-label="t('Device.FlipCamera')"
          @click="flipCamera"
        >
          <IconFlipCamera :size="16" />
        </button>
        <span class="pre-name-tag">{{ displayUserName || t('Preconference.PreviewFallbackName') }}</span>
        <div class="pre-controls">
          <button
            type="button"
            class="pre-media-btn"
            :class="{ 'is-off': !isMicrophoneTesting }"
            :aria-pressed="isMicrophoneTesting"
            :aria-label="isMicrophoneTesting ? t('Device.MicClose') : t('Device.MicOpen')"
            @click="toggleMicrophone"
          >
            <span class="pre-media-icon">
              <MicLevelIcon v-if="isMicrophoneTesting" :size="16" />
              <IconMicOff v-else :size="16" />
              <span v-if="hasMicrophoneError" class="pre-media-fault">!</span>
            </span>
          </button>
          <button
            type="button"
            class="pre-media-btn"
            :class="{ 'is-off': !isCameraTesting }"
            :disabled="isCameraTestLoading"
            :aria-pressed="isCameraTesting"
            :aria-label="isCameraTesting ? t('Device.CamClose') : t('Device.CamOpen')"
            @click="toggleCamera"
          >
            <span class="pre-media-icon">
              <IconCam v-if="isCameraTesting" :size="16" />
              <IconCamOff v-else :size="16" />
              <span v-if="hasCameraError" class="pre-media-fault">!</span>
            </span>
          </button>
        </div>
      </div>

      <div class="pre-actions">
        <section
          v-if="showRefreshReturn"
          class="pre-return"
          :aria-label="t('RefreshReturn.Title')"
        >
          <div class="pre-return-icon" aria-hidden="true">
            <IconRefresh :size="18" />
          </div>
          <div class="pre-return-text">
            <div class="pre-return-title">
              {{ t('RefreshReturn.Title') }}
            </div>
            <div class="pre-return-sub">
              {{ t('RefreshReturn.Still') }}
            </div>
          </div>
          <div class="pre-return-actions">
            <button
              type="button"
              class="pre-return-btn"
              @click="dismissRefreshReturn"
            >
              {{ t('RefreshReturn.Cancel') }}
            </button>
            <button
              type="button"
              class="pre-return-btn is-primary"
              @click="emit('join', linkRoomId)"
            >
              {{ t('RefreshReturn.Confirm') }}
            </button>
          </div>
        </section>
        <template v-else>
          <button
            type="button"
            class="pre-action-card is-primary"
            @click="emit('create')"
          >
            <div class="pre-action-icon">
              <IconCam :size="18" />
            </div>
            <div class="pre-action-text">
              <div class="pre-action-title">
                {{ t('Preconference.CreateTitle') }}
              </div>
              <div class="pre-action-sub">
                {{ t('Preconference.CreateSub') }}
              </div>
            </div>
          </button>
          <button
            type="button"
            class="pre-action-card"
            :class="{ 'is-primary': joinOpen }"
            :aria-expanded="joinOpen"
            @click="toggleJoin"
          >
            <div class="pre-action-icon">
              <IconLogin :size="18" />
            </div>
            <div class="pre-action-text">
              <div class="pre-action-title">
                {{ t('Preconference.Join') }}
              </div>
              <div class="pre-action-sub">
                {{ t('Preconference.JoinSub') }}
              </div>
            </div>
          </button>
        </template>
      </div>

      <div
        v-show="!showRefreshReturn"
        ref="joinExpandRef"
        class="pre-join-expand"
        :class="{ 'is-open': joinOpen }"
      >
        <TUIInput
          v-model="roomInput"
          class="pre-join-input"
          type="number"
          size="lg"
          :maxlength="6"
          :placeholder="t('Preconference.RoomIdPlaceholder')"
          :aria-label="t('Preconference.RoomIdLabel')"
          @enter="submitJoin"
        >
          <template #prefix>
            <IconHash :size="14" />
          </template>
        </TUIInput>
        <TUIButton
          class="pre-join-btn"
          variant="primary"
          @click="submitJoin"
        >
          {{ t('RoomEntry.Join') }}
        </TUIButton>
      </div>

      <section class="recent">
        <div class="recent-label">
          {{ t('Preconference.RecentMeetings') }}
        </div>
        <ScheduledListMobile @join="emit('join', $event)" @detail="openDetail" />
      </section>
    </div>

    <Transition name="pre-detail">
      <div v-if="detailOpen" class="pre-detail">
        <MeetingDetailMobile
          :room-id="detailRoomId"
          @back="detailOpen = false"
          @join="emit('join', $event)"
          @cancelled="detailOpen = false"
        />
      </div>
    </Transition>

    <TUIPopup v-model:open="profileOpen" height="auto">
      <div class="profile-sheet-body">
        <button type="button" class="profile-sheet-logout" @click="askLogout">
          {{ t('Preconference.Logout') }}
        </button>
      </div>
    </TUIPopup>

    <TUIDialog
      v-model:open="logoutOpen"
      :title="t('Preconference.Logout')"
      :confirm-text="t('Preconference.Logout')"
      confirm-variant="danger"
      :cancel-text="t('Cancel')"
      @confirm="confirmLogout"
    >
      {{ t('Preconference.LogoutConfirm') }}
    </TUIDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { DeviceError, DeviceType, MirrorType, useDeviceState, useLoginState } from 'tuikit-atomicx-vue3/room';
import { useRoute, useRouter } from 'vue-router';
import {
  IconCam,
  IconCamOff,
  IconFlipCamera,
  IconHash,
  IconLogin,
  IconMicOff,
  MicLevelIcon,
  IconRefresh,
  MeetingDetailMobile,
  ScheduledListMobile,
  TUIAvatar,
  TUIButton,
  TUIDialog,
  TUIInput,
  TUIPopup,
  TUIToast,
  t,
  useDeviceFault,
} from '@tencentcloud/roomkit-web-vue3';

const emit = defineEmits<{
  create: [];
  join: [roomId: string, password?: string];
  logout: [];
}>();

const { loginUserInfo } = useLoginState();
const displayUserName = computed(() =>
  loginUserInfo.value?.userName || loginUserInfo.value?.userId || '',
);
const displayAvatarUrl = computed(() => loginUserInfo.value?.avatarUrl || '');

const route = useRoute();
const router = useRouter();
const linkRoomId = String(route.query.roomId || '');
const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
const showRefreshReturn = ref(navigation?.type === 'reload' && Boolean(linkRoomId));
const roomInput = ref(linkRoomId);
const joinOpen = ref(Boolean(linkRoomId));

function dismissRefreshReturn() {
  showRefreshReturn.value = false;
  roomInput.value = '';
  joinOpen.value = false;
  router.replace({ query: { ...route.query, roomId: undefined } });
}
const {
  isMicrophoneTesting,
  isCameraTesting,
  isCameraTestLoading,
  isFrontCamera,
  localMirrorType,
  microphoneLastError,
  cameraLastError,
  getMicrophoneList,
  getCameraList,
  startMicrophoneTest,
  stopMicrophoneTest,
  startCameraTest,
  stopCameraTest,
  switchCamera,
  switchMirror,
} = useDeviceState();
const { handleDeviceError, clearDeviceFault, microphoneFault, cameraFault } = useDeviceFault();
const hasMicrophoneError = computed(() =>
  microphoneLastError.value !== DeviceError.NoError || !!microphoneFault.value,
);
const hasCameraError = computed(() =>
  cameraLastError.value !== DeviceError.NoError || !!cameraFault.value,
);
const showVideo = computed(() => isCameraTesting.value || cameraStarting.value);
let frontCameraMirror = isFrontCamera.value ? localMirrorType.value : MirrorType.Auto;
const MIC_TEST_INTERVAL = 200;

const previewRef = ref<HTMLDivElement | null>(null);
const cameraStarting = ref(false);
const profileOpen = ref(false);
const logoutOpen = ref(false);
const detailOpen = ref(false);
const detailRoomId = ref('');
const joinExpandRef = ref<HTMLElement>();
const JOIN_FOCUS_DELAY_MS = 320;
let joinFocusTimer: ReturnType<typeof setTimeout> | undefined;

watch(isCameraTesting, (testing) => {
  if (testing) {
    cameraStarting.value = false;
  }
});

async function startMicrophonePreview() {
  try {
    await startMicrophoneTest({ interval: MIC_TEST_INTERVAL });
    clearDeviceFault(DeviceType.Microphone);
  } catch (error) {
    await handleDeviceError(DeviceType.Microphone, error);
  }
}

async function startCameraPreview() {
  cameraStarting.value = true;
  try {
    await nextTick();
    if (!previewRef.value) {
      cameraStarting.value = false;
      return;
    }
    await startCameraTest({ view: previewRef.value });
    clearDeviceFault(DeviceType.Camera);
  } catch (error) {
    cameraStarting.value = false;
    await handleDeviceError(DeviceType.Camera, error);
  }
}

async function toggleMicrophone() {
  if (isMicrophoneTesting.value) {
    await stopMicrophoneTest().catch(() => {});
    return;
  }
  await startMicrophonePreview();
}

async function toggleCamera() {
  if (isCameraTestLoading.value) {
    return;
  }
  if (isCameraTesting.value) {
    cameraStarting.value = false;
    await stopCameraTest().catch(() => {});
    return;
  }
  await startCameraPreview();
}

async function flipCamera() {
  await switchCamera({ isFrontCamera: !isFrontCamera.value });
  if (isFrontCamera.value) {
    await switchMirror({ mirror: frontCameraMirror });
    return;
  }
  frontCameraMirror = localMirrorType.value;
  await switchMirror({ mirror: MirrorType.Disable });
}

function toggleJoin() {
  joinOpen.value = !joinOpen.value;
  clearTimeout(joinFocusTimer);
  if (joinOpen.value) {
    joinFocusTimer = setTimeout(() => {
      joinExpandRef.value?.querySelector('input')?.focus();
    }, JOIN_FOCUS_DELAY_MS);
  }
}

function submitJoin() {
  const id = String(roomInput.value ?? '').trim();
  if (!id) {
    TUIToast.info(t('Preconference.EmptyRoomId'));
    return;
  }
  if (!/^\d+$/.test(id)) {
    TUIToast.info(t('Preconference.InvalidRoomId'));
    return;
  }
  emit('join', id);
}

function openDetail(id: string) {
  detailRoomId.value = id;
  detailOpen.value = true;
}

function askLogout() {
  profileOpen.value = false;
  logoutOpen.value = true;
}

function confirmLogout() {
  logoutOpen.value = false;
  emit('logout');
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    profileOpen.value = false;
    detailOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  getMicrophoneList().catch(() => {});
  getCameraList().catch(() => {});
  TUIRoomEngine.once('ready', () => {
    startCameraPreview().catch(() => {});
    startMicrophonePreview().catch(() => {});
  });
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  clearTimeout(joinFocusTimer);
  stopMicrophoneTest().catch(() => {});
  stopCameraTest().catch(() => {});
});
</script>

<style scoped lang="scss">
button,
input {
  font: inherit;
}

button {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

button:disabled {
  cursor: not-allowed;
}

button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--rk-brand);
  outline-offset: 3px;
}

.preconference-mobile {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: var(--rk-text-primary);
  background: var(--rk-bg-page);
}

.pre-topbar {
  display: flex;
  flex: none;
  align-items: center;
  height: 52px;
  padding: 8px 16px 0;
}

.pre-profile {
  display: flex;
  gap: 8px;
  align-items: center;
  max-width: 100%;
  min-width: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.pre-profile:active {
  opacity: 0.72;
}

.pre-avatar-btn {
  display: flex;
  flex: none;
  padding: 0;
  appearance: none;
  background: transparent;
  border: none;
  border-radius: 50%;
}

.pre-user-name {
  flex: 0 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: var(--rk-fs-xl);
  font-weight: 600;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 20px 16px 28px;
  overflow: hidden;
}

.pre-preview {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 188px;
  overflow: hidden;
  background: var(--rk-bg-surface);
  border-radius: 18px;
}

.pre-preview.is-on {
  background: var(--rk-bg-camera-off, #11131a);
}

.pre-preview-avatar {
  position: relative;
  z-index: 1;
}

.pre-preview-video {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.pre-preview-video :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pre-flip-camera {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.45);
  border: 0;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
}

.pre-flip-camera:active {
  transform: scale(0.96);
}

.pre-name-tag {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 8;
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  font-family: inherit;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  line-height: 16px;
  color: #fff;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.45);
  border-radius: var(--rk-radius-pill);
}

.pre-controls {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 3;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding-bottom: 4px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.45), transparent);
}

.pre-media-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  overflow: visible;
  color: #fff;
  background: var(--rk-border-strong);
  border: none;
  border-radius: 50%;
}

.pre-media-icon {
  position: relative;
  display: inline-flex;
  width: 16px;
  height: 16px;
  overflow: visible;
}

.pre-media-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.pre-media-fault {
  position: absolute;
  top: -4px;
  right: -6px;
  z-index: 2;
  box-sizing: border-box;
  width: 11px;
  height: 11px;
  font: 700 7px / 8px system-ui, sans-serif;
  color: #000;
  text-align: center;
  pointer-events: none;
  background: var(--rk-warning);
  border: 1.5px solid var(--rk-bg-surface);
  border-radius: 50%;
}

.pre-media-btn:disabled {
  opacity: 0.5;
}

.pre-actions {
  display: flex;
  flex: none;
  gap: 10px;
}

.pre-return {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding: 14px 12px;
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 14px;
}

.pre-return-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--rk-brand);
  background: color-mix(in srgb, var(--rk-brand) 14%, transparent);
  border-radius: 9px;
}

.pre-return-text {
  flex: 1;
  min-width: 0;
}

.pre-return-title,
.pre-return-sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-return-title {
  font-size: var(--rk-fs-md);
  font-weight: 600;
  line-height: 18px;
}

.pre-return-sub {
  margin-top: 1px;
  font-size: var(--rk-fs-sm);
  line-height: 16px;
  color: var(--rk-text-tertiary);
}

.pre-return-actions {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
}

.pre-return-btn {
  height: 28px;
  padding: 0 10px;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  color: var(--rk-text-primary);
  white-space: nowrap;
  appearance: none;
  background: var(--rk-bg-muted);
  border: none;
  border-radius: 8px;
}

.pre-return-btn.is-primary {
  color: var(--rk-on-accent);
  background: var(--rk-brand);
}

.pre-return-btn:disabled {
  opacity: 0.5;
}

.pre-return-btn:active:not(:disabled) {
  filter: brightness(0.96);
}

.pre-action-card {
  position: relative;
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 14px 12px;
  color: var(--rk-text-primary);
  text-align: left;
  background: var(--rk-bg-surface);
  border: 1px solid transparent;
  border-radius: 14px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease;
}

.pre-action-card:disabled {
  opacity: 0.5;
}

@media (hover: hover) and (pointer: fine) {
  .pre-action-card:hover:not(:disabled) {
    background: var(--rk-bg-hover);
  }

  .pre-action-card.is-primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--rk-brand) 22%, transparent);
  }
}

.pre-action-card:active:not(:disabled) {
  transform: scale(0.97);
}

.pre-action-card.is-primary {
  background: var(--rk-brand-soft);
}

.pre-action-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
  border-radius: 9px;
}

.pre-action-card.is-primary .pre-action-icon {
  color: var(--rk-brand);
  background: color-mix(in srgb, var(--rk-brand) 20%, transparent);
}

.pre-action-text {
  min-width: 0;
}

.pre-action-title,
.pre-action-sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-action-title {
  font-size: var(--rk-fs-md);
  font-weight: 600;
}

.pre-action-sub {
  margin-top: 1px;
  font-size: var(--rk-fs-sm);
  color: var(--rk-text-tertiary);
}

.pre-join-expand {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  max-height: 0;
  padding: 0 2px;
  margin: -14px -2px 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    margin-top 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.25s ease;
}

.pre-join-expand.is-open {
  max-height: 56px;
  padding: 4px;
  margin-top: -4px;
  opacity: 1;
}

.pre-join-input.pre-join-input {
  box-sizing: border-box;
  flex: 1;
  gap: 8px;
  min-width: 0;
  height: 40px;
  min-height: 40px;
  padding: 0 12px;
  border-color: var(--rk-border);
  border-radius: 12px;

  font-size: 16px;
}

.pre-join-input :deep(.rk-input-addon),
.pre-join-input :deep(.rk-input-field) {
  padding: 0;
}

.pre-join-input :deep(.rk-icon) {
  flex: none;
  color: var(--rk-text-tertiary);
}

.pre-join-input.pre-join-input:focus-within {
  border-color: var(--rk-brand);
  box-shadow: 0 0 0 3px var(--rk-brand-soft);
}

.pre-join-btn.pre-join-btn {
  flex: none;
  height: 40px;
  padding: 0 16px;
  font-size: var(--rk-fs-md);
  border-radius: 12px;
}

.recent {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.recent-label {
  flex: none;
  margin-bottom: 4px;
  font-size: var(--rk-fs-md);
  font-weight: 600;
  color: var(--rk-text-tertiary);
  letter-spacing: 0.02em;
}

.pre-detail {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
}

.pre-detail-enter-active,
.pre-detail-leave-active {
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.pre-detail-enter-from,
.pre-detail-leave-to {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .pre-detail-enter-active,
  .pre-detail-leave-active {
    transition-duration: 0s;
  }
}

.profile-sheet-body {
  padding: 8px 0 24px;
}

.profile-sheet-logout {
  display: block;
  width: 100%;
  height: 44px;
  font-size: var(--rk-fs-lg);
  font-weight: 600;
  color: var(--rk-danger);
  appearance: none;
  background: color-mix(in srgb, var(--rk-danger) 14%, transparent);
  border: none;
  border-radius: 12px;
}

.profile-sheet-logout:active {
  background: color-mix(in srgb, var(--rk-danger) 18%, transparent);
}
</style>
