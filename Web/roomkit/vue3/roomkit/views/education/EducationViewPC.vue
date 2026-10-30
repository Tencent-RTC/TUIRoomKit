<template>
  <RoomKitProvider ref="hostRef" class="education-root" scene="education">
    <div class="education-view">
      <template v-if="phase === 'idle'">
        <header class="education-topbar">
          <div class="education-topbar-left">
            <CurrentEduRoomInfoPC />
            <LocalNetworkInfoPC />
          </div>

          <div class="education-topbar-right">
            <div class="education-topbar-group">
              <MicButton :icon-size="16" caret-direction="down" />
              <CameraButton caret-direction="down" @open-setting="openSettings" />
              <ToolbarButtonPC
                v-if="isTeacher"
                :label="shareButton.label"
                :icon="IconShare"
                :active="shareButton.active"
                :loading="shareButton.loading"
                :notice="shareButton.notice"
                @click="toggleScreenShare"
              />
            </div>
            <span class="education-topbar-divider" />
            <div class="education-topbar-group">
              <ParticipantButtonPC
                :label="t('Education.Roster.Title')"
                :active="rosterOpen"
                @click="rosterOpen = !rosterOpen"
              />
              <SettingButtonPC :active="settingsOpen" @click="openSettings()" />
            </div>
            <span class="education-topbar-divider" />
            <div class="education-topbar-group">
              <ToolbarButtonPC
                :label="fullscreen ? t('Room.ExitFullscreen') : t('Room.Fullscreen')"
                :icon="IconFullscreen"
                @click="toggleFullscreen"
              />
              <!-- Offset 8 drops the card onto the topbar's bottom edge (28px trigger in a 44px bar). -->
              <TUIPopover
                :open="leaveMenuOpen"
                placement="bottom-end"
                :offset="8"
                :padded="false"
                @update:open="leaveMenuOpen = $event"
              >
                <TUITooltip :content="t('Education.Leave')" :disabled="leaveMenuOpen" placement="bottom">
                  <button
                    class="education-leave"
                    type="button"
                    :aria-label="t('Education.Leave')"
                    aria-haspopup="dialog"
                    :aria-expanded="leaveMenuOpen"
                  >
                    <IconLeave :size="16" />
                  </button>
                </TUITooltip>
                <template #content>
                  <section class="education-leave-card" role="dialog" :aria-label="leaveCard.title">
                    <h3 class="education-leave-card-title">
                      {{ leaveCard.title }}
                    </h3>
                    <p class="education-leave-card-body">
                      {{ leaveCard.body }}
                    </p>
                    <div class="education-leave-card-actions">
                      <TUIButton size="sm" @click="onLeaveSecondary">
                        {{ leaveCard.secondary }}
                      </TUIButton>
                      <TUIButton variant="danger" size="sm" @click="exit(canEndRoom ? 'end' : 'leave')">
                        {{ leaveCard.confirm }}
                      </TUIButton>
                    </div>
                  </section>
                </template>
              </TUIPopover>
            </div>
          </div>
        </header>

        <!-- The swap only moves the board and the teacher between grid areas, so neither
             the video element nor the board canvas is rebuilt. -->
        <main class="education-workspace">
          <section class="education-slot" :class="boardOnStage ? 'is-main' : 'is-side'">
            <div class="education-board" :data-tile-role="boardOnStage ? 'stage' : 'thumb'">
              <template v-if="sharer">
                <RoomParticipantView
                  class="education-board-stream"
                  :participant="sharer"
                  :stream-type="VideoStreamType.Screen"
                  :fill-mode="FillMode.Fit"
                  :lazy-load="{ enable: false }"
                />
                <WhiteboardView :participant="sharer" :stream-type="VideoStreamType.Screen" />
                <span v-if="isScreenSharing" class="education-board-live">
                  <IconShare :size="14" />
                  <span class="education-board-live-text">{{ t('RoomView.SharingScreen') }}</span>
                </span>
                <div v-if="isTeacher && boardOnStage" class="education-board-actions">
                  <AnnotationButton :participant="sharer" :stream-type="VideoStreamType.Screen" />
                </div>
              </template>
              <div v-else-if="boardFailed" class="education-board-empty">
                <span>{{ t('Education.BoardFailed') }}</span>
                <TUIButton size="sm" @click="retryBoard">
                  {{ t('Education.RetryBoard') }}
                </TUIButton>
              </div>
              <div v-else class="education-board-empty">
                <EduStageEmptyArt />
                <span class="education-board-empty-text">{{ t('Education.StageEmpty') }}</span>
              </div>
            </div>
          </section>

          <section class="education-slot" :class="boardOnStage ? 'is-side' : 'is-main'">
            <ParticipantTileEduPC :tile="teacherTile" :tile-role="boardOnStage ? 'thumb' : 'stage'" />
          </section>

          <button
            v-if="stage.canSwap"
            class="education-swap"
            type="button"
            :title="t(boardOnStage ? 'Education.SwapBoard' : 'Education.SwapMain')"
            :aria-label="t(boardOnStage ? 'Education.SwapBoard' : 'Education.SwapMain')"
            @click="swap"
          >
            <IconEduSwap :size="14" />
          </button>

          <section class="education-slot is-student" :data-trophy-landing="studentTile.participant?.userId || ''">
            <ParticipantTileEduPC :tile="studentTile" tile-role="thumb" />
          </section>

          <section class="education-chat">
            <RoomChatPC
              class="education-chat-body"
              is-hide-operator
              is-hide-timestamp
              is-highlight-owner
              is-show-member-notice
              :placeholder="t('Education.Chat.Placeholder1v1')"
            >
              <template #header>
                <header class="education-chat-head">
                  <strong class="education-chat-title">{{ t('Education.ChatTitle') }}</strong>
                </header>
              </template>
              <template #meta="{ message }">
                <span
                  v-if="isTeacherMessage(message)"
                  class="education-chat-teacher-tag"
                >
                  {{ t('Education.Teacher') }}
                </span>
              </template>
            </RoomChatPC>
          </section>
        </main>

        <SettingsDialogPC
          :open="settingsOpen"
          :active-tab="settingsTab"
          :hidden-items="['theme']"
          :virtual-background-img-list="VIRTUAL_BACKGROUND_IMG_LIST"
          @select="settingsTab = $event"
          @close="settingsOpen = false"
        />
        <EduRoster v-model:open="rosterOpen" />
        <!-- Scene-wide: the celebration plays even while the roster is closed. -->
        <Trophy />
      </template>

      <div v-if="loadingKey" class="education-join-loading">
        <TUILoading variant="card" size="lg" :tip="t(loadingKey)" />
      </div>
      <TUIDialog
        :open="phase === 'password'"
        :title="t('RoomEntry.PasswordTitle')"
        width="420px"
        :confirm-text="t('RoomEntry.Join')"
        :cancel-text="t('RoomEntry.Cancel')"
        :closable="false"
        :close-on-overlay="false"
        @confirm="submitPassword"
        @close="roomEntry.cancelPassword()"
      >
        <TUIInput
          :model-value="password"
          type="password"
          show-password
          :maxlength="6"
          text-align="center"
          auto-focus
          :status="passwordErrorKey ? 'error' : 'default'"
          @update:model-value="onPasswordInput"
          @enter="submitPassword"
        />
        <p v-if="passwordErrorKey" class="education-join-error">
          {{ t(passwordErrorKey) }}
        </p>
      </TUIDialog>
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { FillMode, RoomParticipantView, VideoStreamType } from 'tuikit-atomicx-vue3/room';
import {
  IconEduSwap,
  IconFullscreen,
  IconLeave,
  IconShare,
  RoomKitProvider,
  TUIButton,
  TUIDialog,
  TUIInput,
  TUILoading,
  TUIPopover,
  TUITooltip,
  useFullscreen,
  t,
} from '../../base';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  AnnotationButton,
  CameraButton,
  CurrentEduRoomInfoPC,
  LocalNetworkInfoPC,
  MicButton,
  ParticipantButtonPC,
  EduRoster,
  RoomChatPC,
  SettingButtonPC,
  SettingsDialogPC,
  Trophy,
  WhiteboardView,
} from '../../features';
import type { BackgroundPhoto, SettingsTab } from '../../features';
import ToolbarButtonPC from '../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';
import virtualBgLectureHall from './assets/virtual-backgrounds/lecture-hall.jpeg';
import virtualBgLibrary from './assets/virtual-backgrounds/library.jpeg';
import virtualBgMathClassroom from './assets/virtual-backgrounds/math-classroom.jpeg';
import virtualBgReadingCorner from './assets/virtual-backgrounds/reading-corner.jpeg';
import virtualBgScienceLab from './assets/virtual-backgrounds/science-lab.jpeg';
import virtualBgStudyRoom from './assets/virtual-backgrounds/study-room.jpeg';
import EduStageEmptyArt from './EduStageEmptyArt.vue';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { EDU_CLASS_EVENT_ID, useMemberNoticeSender } from '../../features/Chat/customMessage';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomTips } from './hooks/useRoomTips';
import { useClassroomBoard } from './hooks/useClassroomBoard';
import ParticipantTileEduPC from './ParticipantTileEduPC.vue';
import { useClassroom } from './classroomData';
import { useClassroomActions } from './classroomActions';

const emit = defineEmits<{
  leave: [];
}>();

// Ids must not overlap with the built-in conference set: the image cache is keyed by id.
const VIRTUAL_BACKGROUND_IMG_LIST: BackgroundPhoto[] = [
  { id: 'e1', imagePath: virtualBgReadingCorner },
  { id: 'e2', imagePath: virtualBgMathClassroom },
  { id: 'e3', imagePath: virtualBgStudyRoom },
  { id: 'e4', imagePath: virtualBgLibrary },
  { id: 'e5', imagePath: virtualBgLectureHall },
  { id: 'e6', imagePath: virtualBgScienceLab },
];

const { phase } = roomEntry;
const hostRef = ref<ComponentPublicInstance | null>(null);
const rootRef = computed<HTMLElement | null>(() => (hostRef.value?.$el as HTMLElement | null) ?? null);

// Mounted before the join runs, so tips catch events a late joiner receives.
useRoomTips({ onLeave: () => emit('leave') });
useAutoPlayDialog();

const LOADING_KEYS: Partial<Record<RoomEntryPhase, string>> = {
  login: 'RoomEntry.LoggingIn',
  profile: 'Education.Entry.Preparing',
  joining: 'Education.Entry.Joining',
};
const loadingKey = computed(() => LOADING_KEYS[phase.value]);

const password = ref('');
const passwordErrorKey = ref('');

// A wrong password sends the entry back to this phase with an `incorrect` challenge.
watch(phase, (value) => {
  if (value !== 'password') {
    return;
  }
  password.value = '';
  passwordErrorKey.value = roomEntry.passwordChallenge.value === 'incorrect' ? 'RoomEntry.WrongPassword' : '';
});

function onPasswordInput(value: string | number | null) {
  password.value = String(value ?? '').replace(/\D/g, '').slice(0, 6);
  passwordErrorKey.value = '';
}

function submitPassword() {
  if (!/^\d{6}$/.test(password.value)) {
    passwordErrorKey.value = 'RoomEntry.InvalidPassword';
    return;
  }
  roomEntry.submitPassword(password.value);
}

const { canEndRoom, leaveRoom, endRoom } = useRoomExit();
const leaveMenuOpen = ref(false);

/** The teacher's card ends the class or steps out; the student's card leaves or stays. */
const leaveCard = computed(() => (canEndRoom.value
  ? {
    title: t('Education.Leave.TeacherTitle'),
    body: t('Education.Leave.TeacherBody'),
    secondary: t('Education.Leave.StepOut'),
    confirm: t('Education.Leave.TeacherConfirm'),
  }
  : {
    title: t('Education.Leave.StudentTitle'),
    body: t('Education.Leave.StudentBody'),
    secondary: t('Education.Leave.StudentCancel'),
    confirm: t('Education.Leave.StudentConfirm'),
  }));

async function exit(action: 'leave' | 'end') {
  leaveMenuOpen.value = false;
  await (action === 'end' ? endRoom() : leaveRoom());
  emit('leave');
}

/** The teacher steps out of a class that keeps running; the student just closes the card. */
function onLeaveSecondary() {
  if (canEndRoom.value) {
    void exit('leave');
    return;
  }
  leaveMenuOpen.value = false;
}

const { isTeacher, teacher, sharer, stage, teacherTile, studentTile } = useClassroom();
const { swap } = useClassroomActions();
const boardOnStage = computed(() => stage.value.main === 'board');
const {
  failed: boardFailed,
  isScreenSharing,
  shareButton,
  retry: retryBoard,
  toggleScreenShare,
} = useClassroomBoard(() => boardOnStage.value, () => rootRef.value);
const { fullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);

// Classroom events ride the chat group; wire them at view level.
useMemberNoticeSender(EDU_CLASS_EVENT_ID);
const teacherId = computed(() => teacher.value?.userId || '');

function isTeacherMessage(message: { from?: { userID?: string } }) {
  return Boolean(message.from?.userID) && message.from?.userID === teacherId.value;
}

const settingsOpen = ref(false);
const settingsTab = ref<SettingsTab>('audio');
const rosterOpen = ref(false);

function openSettings(tab: SettingsTab = 'audio') {
  settingsTab.value = tab;
  settingsOpen.value = true;
}
</script>

<style scoped lang="scss">
.education-root {
  height: 100%;
}

.education-root :deep(.rk-root-slot) {
  height: 100%;
}

.education-view {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
  background: var(--rk-bg-page);
}

.education-topbar {
  position: relative;
  z-index: 20;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 12px 0 16px;
  background: var(--rk-bg-surface);
  border-bottom: 1px solid var(--rk-border);
}

.education-topbar-left,
.education-topbar-right,
.education-topbar-group {
  display: flex;
  align-items: center;
  min-width: 0;
}

.education-topbar-left {
  gap: 8px;
}

.education-topbar-right {
  flex-shrink: 0;
  gap: 8px;
}

.education-topbar-group {
  gap: 10px;
}

.education-topbar-divider {
  width: 1px;
  height: 14px;
  margin: 0 4px;
  background: var(--rk-border);
}

/* Toolbar chips are sized for the bottom bar; the classroom topbar runs them at 28px. */
.education-topbar :deep(.toolbar-button) {
  min-width: 28px;
  height: 28px;
  background: transparent;
  border-radius: 7px;
}

.education-topbar :deep(.toolbar-button:hover) {
  background: color-mix(in srgb, var(--rk-text-primary) 8%, transparent);
}

.education-topbar :deep(.toolbar-button-main) {
  min-width: 28px;
  padding: 0;
}

.education-topbar :deep(.toolbar-button-icon),
.education-topbar :deep(.toolbar-button-icon svg) {
  width: 16px;
  height: 16px;
}

/* Device chips with a menu keep a tinted split surface, 30px tall.
   The design's yellow "!" fault badge reads one size smaller here. */
.education-topbar :deep(.toolbar-button-with-menu) {
  --rk-fault-badge: 11px;
  --rk-fault-badge-font: 7px;
  --rk-fault-badge-top: -4px;
  --rk-fault-badge-right: -6px;

  min-width: 44px;
  height: 30px;
  padding: 1px;
  background: color-mix(in srgb, var(--rk-text-primary) 8%, transparent);
  border-radius: 8px;
}

.education-topbar :deep(.toolbar-button-with-menu .toolbar-button-main) {
  min-width: 28px;
  padding: 0;
}

.education-topbar :deep(.toolbar-button-caret) {
  width: 14px;
  padding: 0;
}

.education-topbar :deep(.toolbar-button-active) {
  background: color-mix(in srgb, var(--rk-brand) 14%, transparent);
}

.education-topbar :deep(.toolbar-button-active .toolbar-button-icon) {
  color: var(--rk-brand);
}

.education-leave {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-danger);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
}

.education-leave:hover {
  background: color-mix(in srgb, var(--rk-danger) 14%, transparent);
}

/* The design keeps the trigger plain red while the card is open. */
.education-leave[aria-expanded='true'] {
  background: transparent;
}

.education-leave-card {
  box-sizing: border-box;
  width: max-content;
  min-width: min(280px, calc(100vw - 24px));
  max-width: min(360px, calc(100vw - 24px));
  padding: 14px 14px 12px;
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: var(--rk-radius-lg);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.16);
}

.education-leave-card-title {
  margin: 0 0 4px;
  font-size: var(--rk-fs-lg);
  font-weight: 590;
  line-height: 1.4;
  letter-spacing: -0.02em;
}

.education-leave-card-body {
  margin: 0 0 12px;
  font-size: var(--rk-fs-sm);
  line-height: 1.5;
  color: var(--rk-text-secondary);
}

.education-leave-card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.education-leave-card-actions > .rk-btn {
  flex: none;
  height: 32px;
  padding: 0 12px;
  font-size: var(--rk-fs-md);
  font-weight: 400;
  border: 0;
  border-radius: 8px;
}

.education-leave-card-actions > .rk-btn-secondary {
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-text-primary) 8%, transparent);
}

.education-leave-card-actions > .rk-btn-secondary:hover {
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-text-primary) 12%, transparent);
}

.education-workspace {
  display: grid;
  flex: 1;
  grid-template:
    'main teacher' auto
    'main student' auto
    'main chat' minmax(0, 1fr) / minmax(0, 1fr) clamp(280px, 20%, 360px);
  gap: 10px;
  min-height: 0;
  padding: 10px;
  background: var(--rk-bg-page);
}

@media (width <= 820px) {
  .education-workspace {
    grid-template-columns: minmax(0, 1fr) 34%;
  }
}

.education-slot {
  min-width: 0;
  min-height: 0;
}

/* The main area keeps 16:9 and letterboxes inside whatever the workspace leaves. */
.education-slot.is-main {
  position: relative;
  display: flex;
  grid-area: main;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse 70% 60% at 50% 50%, color-mix(in srgb, var(--rk-bg-surface) 50%, transparent), transparent 70%);
  isolation: isolate;
  container-type: size;
}

/* Pixel art in the letterbox corners: bottom-left, and the same art flipped and
   smaller at top-right. Whatever the main tile covers simply stays behind it. */
.education-slot.is-main::before,
.education-slot.is-main::after {
  position: absolute;
  z-index: -1;
  width: clamp(240px, 34cqw, 560px);
  aspect-ratio: 308 / 126;
  pointer-events: none;
  content: '';
  background: color-mix(in srgb, var(--rk-brand) 28%, transparent);
  mask: url('./assets/stage-pixels.svg') center / contain no-repeat;
}

.education-slot.is-main::before {
  bottom: 0;
  left: 0;
}

.education-slot.is-main::after {
  top: 0;
  right: 0;
  width: clamp(168px, 24cqw, 400px);
  opacity: 0.7;
  transform: scale(-1, -1);
}

.education-slot.is-main > * {
  width: min(100cqw, calc(100cqh * 16 / 9));
  max-width: 100%;
  height: auto;
  max-height: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--rk-text-primary) 7%, transparent), var(--rk-shadow-dialog);
}

.education-slot.is-side {
  grid-area: teacher;
}

.education-slot.is-student {
  grid-area: student;
}

.education-slot.is-side > *,
.education-slot.is-student > * {
  aspect-ratio: 16 / 9;
}

.education-board {
  --whiteboard-view-bg: var(--rk-bg-surface);

  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--rk-bg-surface);
  border-radius: 10px;
}

.education-board-stream {
  width: 100%;
  height: 100%;
}

.education-board-live {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 4;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  max-width: calc(100% - 16px);
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  pointer-events: none;
  background: var(--rk-brand);
  border-radius: 6px;
}

.education-board-live-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.education-board-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  display: flex;
  align-items: center;
  pointer-events: none;
}

/* The shared annotation chip ships the conference blue pill; the classroom uses the brand tag shape. */
.education-board-actions :deep(.rk-btn.annotation-button) {
  height: 24px;
  padding: 0 8px;
  font-weight: 500;
  background: color-mix(in srgb, var(--rk-brand) 92%, transparent);
  backdrop-filter: none;
  border-radius: 6px;
  box-shadow: none;
}

.education-board-actions :deep(.rk-btn.annotation-button:hover:not(:disabled)) {
  background: color-mix(in srgb, var(--rk-brand) 82%, #000);
}

.education-board-actions :deep(.rk-btn.annotation-button svg) {
  width: 14px;
  height: 14px;
}

.education-board-empty {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  margin: 0;
  font-size: var(--rk-fs-sm);
  color: var(--rk-text-tertiary);
}

.education-board-empty-text {
  max-width: 320px;
  font-size: var(--rk-fs-md);
  line-height: 1.5;
  color: var(--rk-text-secondary);
  text-align: center;
}

/* Sits on whichever block holds the teacher seat. */
.education-swap {
  z-index: 6;
  display: grid;
  grid-area: teacher;
  place-items: center;
  place-self: end;
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 8px;
  color: color-mix(in srgb, #fff 75%, transparent);
  cursor: pointer;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
}

.education-swap:hover {
  background: rgba(0, 0, 0, 0.62);
}

.education-chat {
  display: flex;
  flex-direction: column;
  grid-area: chat;
  min-height: 0;
  overflow: hidden;
  background: var(--rk-bg-surface);
  border-radius: 12px;
}

.education-chat-body {
  flex: 1;
  min-height: 0;
}

/* Slot content keeps the parent scope, so the classroom title bar
   and the teacher tag styles live here. The design separates the
   title from the message list with a border. */
.education-chat-head {
  display: flex;
  flex: 0 0 36px;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 0 14px;
  background: var(--rk-bg-surface);
  border-bottom: 1px solid var(--rk-border);
}

.education-chat-title {
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  line-height: 18px;
  color: var(--rk-text-primary);
}

.education-chat-teacher-tag {
  box-sizing: border-box;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: 16px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  color: var(--rk-brand);
  background: color-mix(in srgb, var(--rk-brand) 18%, transparent);
  border-radius: 4px;
}

.education-join-loading {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-bg-overlay);
  backdrop-filter: blur(8px);
}

.education-join-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--rk-danger);
  text-align: center;
}
</style>

<style lang="scss">
/* TUIPopover teleports the card; strip the float chrome so the card owns the surface. */
.rk-float.rk-popover:has(> .education-leave-card) {
  min-width: 0;
  padding: 0;
  overflow: visible;
  background: transparent;
  border: 0;
  box-shadow: none;
}
</style>
