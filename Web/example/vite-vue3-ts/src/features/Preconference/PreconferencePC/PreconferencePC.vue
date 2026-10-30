<template>
  <RoomKitProvider class="preconference-root">
    <div
      ref="viewRef"
      class="preconference-view"
      :class="{
        'is-compact': compact,
        'is-preview-open': compact && previewOpen,
      }"
    >
      <PreconferenceTopbar
        :user-name="displayUserName"
        :avatar-url="displayAvatarUrl"
        :compact="compact"
        :preview-open="previewOpen"
        @logout="emit('logout')"
        @open-preview="previewOpen = true"
      />
      <div v-if="faultBannerKey" class="pre-fault-banner">
        <IconAlertCircle :size="14" />
        <span>{{ t(faultBannerKey) }}</span>
      </div>
      <main class="pre-main">
        <div
          v-if="compact && previewOpen"
          class="preview-backdrop"
          @click="closePreview"
        />
        <div class="pre-grid">
          <section
            class="preview-card"
            :aria-label="t('Preconference.PreviewRegion')"
          >
            <div
              class="preview-compact-close"
              role="button"
              tabindex="0"
              :aria-label="t('Preconference.ClosePreview')"
              @click="closePreview"
              @keydown.enter.prevent="closePreview"
              @keydown.space.prevent="closePreview"
            >
              <IconClose :size="12" />
            </div>
            <slot name="preview">
              <LocalPreview
                v-if="!compact || previewOpen"
                @banner-change="faultBannerKey = $event"
              />
            </slot>
            <slot name="devices" />
          </section>
          <div class="join-side">
            <div
              class="join-stack"
              :class="{ 'is-refresh-return': showRefreshReturn }"
            >
              <JoinCard
                v-model:room-id="roomInput"
                @create="emit('create')"
                @schedule="openSchedule()"
                @join="emit('join', $event)"
              />
              <RefreshReturnCard
                @confirm="emit('join', linkRoomId)"
                @cancel="dismissRefreshReturn"
              />
            </div>
            <ScheduledListPC
              @join="emit('join', $event)"
              @edit="openSchedule($event)"
            />
          </div>
        </div>
      </main>
      <SchedulePanel
        v-model:open="scheduleOpen"
        :user-name="displayUserName"
        :meeting="editingMeeting"
        :schedule="submitSchedule"
        @scheduled="editingMeeting = undefined"
      />
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
/* eslint-disable no-await-in-loop */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import type { RoomInfo } from 'tuikit-atomicx-vue3/room';
import { useRoute, useRouter } from 'vue-router';
import {
  IconAlertCircle,
  IconClose,
  RoomKitProvider,
  ScheduledListPC,
  SchedulePanel,
  t,
} from '@tencentcloud/roomkit-web-vue3';
import type {
  ScheduleOutcome,
  ScheduleRoomInput,
} from '@tencentcloud/roomkit-web-vue3';
import LocalPreview from './LocalPreview.vue';
import RefreshReturnCard from './RefreshReturnCard.vue';
import JoinCard from './JoinCard.vue';
import PreconferenceTopbar from './PreconferenceTopbar.vue';

const COMPACT_WIDTH = 950;
const ROOM_ID_ATTEMPTS = 5;

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

function dismissRefreshReturn() {
  showRefreshReturn.value = false;
  roomInput.value = '';
  router.replace({ query: { ...route.query, roomId: undefined } });
}

const roomState = useRoomState();
const viewRef = ref<HTMLElement>();
const compact = ref(false);
const previewOpen = ref(false);
const scheduleOpen = ref(false);
const editingMeeting = ref<RoomInfo>();
const faultBannerKey = ref<string>();
let resizeObserver: ResizeObserver | undefined;

function syncCompact() {
  void nextTick(() => {
    const width = viewRef.value?.offsetWidth ?? 0;
    compact.value = width > 0 && width < COMPACT_WIDTH;
    if (!compact.value) {
      previewOpen.value = false;
    }
  });
}

function closePreview() {
  previewOpen.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && previewOpen.value) {
    closePreview();
  }
}

onMounted(() => {
  if (viewRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(syncCompact);
    resizeObserver.observe(viewRef.value);
    syncCompact();
  }
  document.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  document.removeEventListener('keydown', onKeydown);
});

async function isRoomIdFree(roomId: string): Promise<boolean> {
  try {
    await roomState.getRoomInfo({ roomId });
    return false;
  } catch (error) {
    if ((error as { code?: number })?.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) return true;
    throw error;
  }
}

async function scheduleMeeting(input: ScheduleRoomInput): Promise<ScheduleOutcome> {
  const options = {
    roomName: input.roomName,
    scheduleStartTime: input.scheduledStartTime,
    scheduleEndTime: input.scheduledEndTime,
    scheduleAttendees: input.scheduleAttendees,
    password: input.password || '',
    isAllMicrophoneDisabled: !!input.isAllMicrophoneDisabled,
    isAllCameraDisabled: !!input.isAllCameraDisabled,
  };
  try {
    for (let attempt = 0; attempt < ROOM_ID_ATTEMPTS; attempt += 1) {
      const roomId = String(Math.floor(100000 + Math.random() * 900000));
      if (await isRoomIdFree(roomId)) {
        try {
          await roomState.scheduleRoom({ roomId, options });
          return { roomId };
        } catch (error) {
          if ((error as { code?: number })?.code !== TUIErrorCode.ERR_ROOM_ID_OCCUPIED) throw error;
        }
      }
    }
    return { failure: 'id-exhausted' };
  } catch (error) {
    console.error('[PreconferencePC] Failed to schedule room:', error);
    return { failure: 'failed' };
  }
}

async function updateMeeting(meeting: RoomInfo, input: ScheduleRoomInput): Promise<ScheduleOutcome> {
  const { roomId } = meeting;
  const before = (meeting.scheduleAttendees ?? []).map(user => user.userId);
  const after = input.scheduleAttendees;
  const added = after.filter(userId => !before.includes(userId));
  const removed = before.filter(userId => !after.includes(userId));
  try {
    await roomState.updateScheduledRoom({
      roomId,
      options: {
        roomName: input.roomName,
        scheduleStartTime: input.scheduledStartTime,
        scheduleEndTime: input.scheduledEndTime,
      },
    });
    if (added.length) await roomState.addScheduledAttendees({ roomId, userIdList: added });
    if (removed.length) await roomState.removeScheduledAttendees({ roomId, userIdList: removed });
    return { roomId };
  } catch (error) {
    console.error('[PreconferencePC] Failed to update scheduled room:', error);
    return { failure: 'failed' };
  }
}

function submitSchedule(input: ScheduleRoomInput) {
  return editingMeeting.value ? updateMeeting(editingMeeting.value, input) : scheduleMeeting(input);
}

function openSchedule(meeting?: RoomInfo) {
  editingMeeting.value = meeting;
  scheduleOpen.value = true;
}
</script>

<style scoped lang="scss">
.preconference-root {
  height: 100%;
  min-height: 0;
}

.preconference-root :deep(.rk-root-slot) {
  height: 100%;
}

.preconference-view {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--rk-bg-page);
  container-type: size;
}

[role='button']:focus-visible {
  outline: 2px solid var(--rk-brand);
  outline-offset: 3px;
}

.pre-fault-banner {
  position: absolute;
  top: 76px;
  right: 40px;
  left: 40px;
  z-index: 20;
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  margin: 0;
  padding: 10px 14px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  line-height: 1.45;
  color: #c24141;
  background: color-mix(in srgb, var(--rk-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--rk-danger) 30%, transparent);
  border-radius: 12px;
}

:global(.rk-root[data-rk-theme='dark'] .pre-fault-banner) {
  color: var(--rk-text-primary);
}

.pre-main {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  min-height: 0;
  min-width: 0;
  width: 100%;

  padding: clamp(16px, 5vh, 76px) 40px;
  overflow: hidden auto;
}

.preview-backdrop {
  position: absolute;
  inset: 0;
  z-index: 98;
  cursor: pointer;
  background: rgb(0 0 0 / 45%);
}

.pre-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(380px, 1fr);
  flex: 0 0 auto;
  gap: 24px;

  width: 75%;
  height: 95%;

  min-height: 520px;
  min-width: 0;

  margin-block: auto;
}

.preview-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;

  min-height: 400px;
  padding: 20px;
  overflow: hidden;
  background: var(--rk-bg-surface);
  border-radius: var(--rk-radius-xl);
}

.preview-compact-close {
  display: none;
}

.join-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 380px;
  min-height: 0;
  overflow: hidden;
}

.join-stack {
  display: grid;
  flex: none;
}

.join-stack > :deep(.join-card),
.join-stack > :deep(.refresh-return-card) {
  grid-area: 1 / 1;
}

.join-stack.is-refresh-return > :deep(.join-card) {
  pointer-events: none;
  visibility: hidden;
}

.join-stack:not(.is-refresh-return) > :deep(.refresh-return-card) {
  pointer-events: none;
  visibility: hidden;
}

.preconference-root[data-rk-theme='dark'] :deep(.join-form .join-submit:disabled) {
  background: var(--rk-bg-muted);
}

.is-compact .pre-main {
  justify-content: flex-start;
  padding: 2% 5% 3%;
}

.is-compact .pre-grid {
  flex: none;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto;
  width: 100%;
  max-width: 100%;
  height: auto;
  min-height: 0;
}

.is-compact .preview-card {
  display: none;
  min-height: 0;
}

.is-compact .join-side {
  min-width: 0;
  overflow: visible;
}

.is-preview-open .preview-card {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 99;
  display: flex;
  width: calc(100% - 80px);
  max-width: 480px;
  max-height: calc(100% - 80px);
  overflow-y: auto;
  transform: translate(-50%, -50%);
}

.is-preview-open :deep(.video-preview) {
  min-height: 200px;
}

.is-preview-open .preview-compact-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: var(--rk-bg-hover);
  border-radius: 8px;
}

@media (width <= 520px) {
  .pre-main,
  .is-compact .pre-main {
    padding: 12px 16px 24px;
  }
}

@media (width <= 1548px) {
  .pre-grid {
    width: 100%;
    max-width: 1102px;
  }
}
</style>
