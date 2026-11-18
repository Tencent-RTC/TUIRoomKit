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
              <MicButton v-if="uiConfig.widgetVisible.MicWidget !== false" :icon-size="16" caret-direction="down" />
              <CameraButton v-if="uiConfig.widgetVisible.CameraWidget !== false" caret-direction="down" @open-setting="openSettings" />
              <ToolbarButtonPC
                v-if="isTeacher && uiConfig.widgetVisible.ScreenShareWidget !== false"
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
                v-if="uiConfig.widgetVisible.MemberWidget !== false"
                :label="t('Education.Roster.Title')"
                :active="rosterOpen"
                @click="rosterOpen = !rosterOpen"
              />
              <SettingButtonPC v-if="uiConfig.widgetVisible.SettingsWidget !== false" :active="settingsOpen" @click="openSettings()" />
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
                v-if="uiConfig.widgetVisible.LeaveRoomWidget !== false"
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
                  <EduLeaveCard
                    :title="leaveCard.title"
                    :body="leaveCard.body"
                    :secondary-text="leaveCard.secondary"
                    :confirm-text="leaveCard.confirm"
                    @secondary="onLeaveSecondary"
                    @confirm="exit(canEndRoom ? 'end' : 'leave')"
                  />
                </template>
              </TUIPopover>
            </div>
          </div>
        </header>

        <!-- The swap only moves the board and the teacher between grid areas, so neither
             the video element nor the board canvas is rebuilt. -->
        <main class="education-workspace" :class="{ 'is-small': isSmall }">
          <section v-if="isSmall" class="education-stage-strip">
            <div class="education-stage-strip-track">
              <ParticipantTileEduPC :tile="teacherTile" tile-role="thumb" in-strip />
              <ParticipantTileEduPC
                v-for="tile in studentTiles"
                :key="tile.participant?.userId"
                :tile="tile"
                tile-role="thumb"
                in-strip
                :data-trophy-landing="tile.participant?.userId || undefined"
              />
            </div>
          </section>
          <section class="education-slot" :class="isSmall || boardOnStage ? 'is-main' : 'is-side'">
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
                <div v-if="isTeacher && boardOnStage && uiConfig.widgetVisible.AnnotationWidget !== false" class="education-board-actions">
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

          <section v-if="!isSmall" class="education-slot" :class="boardOnStage ? 'is-side' : 'is-main'">
            <ParticipantTileEduPC :tile="teacherTile" :tile-role="boardOnStage ? 'thumb' : 'stage'" />
          </section>

          <button
            v-if="!isSmall && stage.canSwap"
            class="education-swap"
            type="button"
            :title="t(boardOnStage ? 'Education.SwapBoard' : 'Education.SwapMain')"
            :aria-label="t(boardOnStage ? 'Education.SwapBoard' : 'Education.SwapMain')"
            @click="swap"
          >
            <IconEduSwap :size="14" />
          </button>

          <section v-if="!isSmall && studentTiles[0]" class="education-slot is-student" :data-trophy-landing="studentTiles[0].participant?.userId || ''">
            <ParticipantTileEduPC :tile="studentTiles[0]" tile-role="thumb" />
          </section>

          <section v-if="!isSmall && uiConfig.widgetVisible.RoomChatWidget !== false" class="education-chat">
            <RoomChat
              class="education-chat-body"
              is-hide-operator
              is-hide-timestamp
              is-highlight-owner
              is-show-member-notice
              is-show-new-messages
              :placeholder="t('Education.Chat.PlaceholderOnetoone')"
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
            </RoomChat>
          </section>
        </main>

        <!-- small: the class chat floats. The bar carries the title and mute-all;
             the notice card stays inside the chat panel. -->
        <button
          v-if="isSmall && uiConfig.widgetVisible.RoomChatWidget !== false"
          class="education-float-chat-fab"
          :class="{ 'is-open': chatOpen }"
          type="button"
          :aria-expanded="chatOpen"
          :aria-label="t('Education.ChatTitle')"
          @click="chatOpen = !chatOpen"
        >
          <IconChat :size="18" />
          <em v-if="chatUnreadLabel" class="education-float-chat-badge">{{ chatUnreadLabel }}</em>
        </button>
        <ChatContextSync
          v-if="isSmall && roomId && uiConfig.widgetVisible.RoomChatWidget !== false"
          :channel="roomId"
          :is-active="chatOpen"
          @unread-change="chatUnread = $event"
        />
        <section
          v-if="isSmall && uiConfig.widgetVisible.RoomChatWidget !== false"
          v-show="chatOpen"
          ref="chatPanelRef"
          class="education-float-chat"
          :class="{ 'is-dragging': chatDragging }"
          :style="chatPanelStyle"
        >
          <div
            v-for="dir in chatResizeDirs"
            :key="dir"
            class="education-float-chat-resize"
            :data-dir="dir"
          />
          <header ref="chatBarRef" class="education-float-chat-bar">
            <div class="education-float-chat-bar-lead">
              <strong class="education-float-chat-bar-title">{{ t('Education.ChatTitle') }}</strong>
            </div>
            <label
              v-if="canModerate"
              class="education-float-chat-bar-silence"
              @pointerdown.stop
            >
              <span>{{ t('Education.Chat.SilenceAll') }}</span>
              <TUISwitch size="sm" :model-value="silenceAll" @change="onToggleSilenceAll" />
            </label>
            <button
              class="education-float-chat-close"
              type="button"
              :aria-label="t('Education.Chat.Close')"
              @click="chatOpen = false"
            >
              <IconClose :size="12" />
            </button>
          </header>
          <RoomChat
            class="education-float-chat-body"
            :active="chatOpen"
            is-hide-operator
            is-hide-timestamp
            is-highlight-owner
            is-show-member-notice
            is-show-notice
            is-show-new-messages
            :placeholder="t('Education.Chat.Placeholder')"
          >
            <template #meta="{ message }">
              <span v-if="isTeacherMessage(message)" class="education-chat-teacher-tag">
                {{ t('Education.Teacher') }}
              </span>
            </template>
          </RoomChat>
        </section>

        <SettingsDialogPC
          :open="settingsOpen"
          :active-tab="settingsTab"
          :hidden-items="isTeacher ? ['theme'] : ['theme', 'share']"
          :virtual-background-img-list="EDUCATION_VIRTUAL_BACKGROUND_IMG_LIST"
          @select="settingsTab = $event"
          @close="settingsOpen = false"
        />
        <EduRosterPC v-model:open="rosterOpen" :show-mute-all="isSmall" />
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { FillMode, RoomParticipantView, VideoStreamType, useRoomState } from 'tuikit-atomicx-vue3/room';
import {
  IconChat,
  IconClose,
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
  TUISwitch,
  TUIToast,
  TUITooltip,
  clampBox,
  useDrag,
  useFullscreen,
  useUIConfig,
  t,
} from '../../base';
import type { Bounds } from '../../base';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  AnnotationButton,
  CameraButton,
  CurrentEduRoomInfoPC,
  LocalNetworkInfoPC,
  MicButton,
  ParticipantButtonPC,
  EduRosterPC,
  RoomChat,
  SettingButtonPC,
  SettingsDialogPC,
  Trophy,
  WhiteboardView,
} from '../../features';
import type { SettingsTab } from '../../features';
import ToolbarButtonPC from '../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';
import { EDUCATION_VIRTUAL_BACKGROUND_IMG_LIST } from './virtualBackgroundImgList';
import EduStageEmptyArt from './EduStageEmptyArt.vue';
import EduLeaveCard from './EduLeaveCard.vue';
import { useSilenceAll } from '../../features/Chat/RoomChat/useSilenceAll';
import ChatContextSync from '../../features/Chat/ChatButton/ChatContextSync.vue';
import { useParticipantPermission } from '../../features/Participants/participantData';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { EDU_CLASS_EVENT_ID } from '../../features/Chat/customMessage';
import { useSelfEnterAnnouncer } from '../../features/Chat/RoomChat/memberNotice';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomTips } from './hooks/useRoomTips';
import { useClassroomBoard } from './hooks/useClassroomBoard';
import ParticipantTileEduPC from './ParticipantTileEduPC.vue';
import { ClassMode, useClassroom } from './classroomData';
import { useClassroomActions } from './classroomActions';

const emit = defineEmits<{
  leave: [];
}>();

const { phase } = roomEntry;
const { uiConfig } = useUIConfig();
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

const { isTeacher, teacher, sharer, stage, teacherTile, studentTiles, classMode } = useClassroom();
const isSmall = computed(() => classMode.value === ClassMode.Small);
const { silenceAll, toggleSilenceAll } = useSilenceAll();
const { isHostOrAdmin: canModerate } = useParticipantPermission();

/** The design toasts the operator on every class-wide silence flip. */
async function onToggleSilenceAll() {
  const next = !silenceAll.value;
  await toggleSilenceAll();
  TUIToast.success(t(next ? 'Education.Settings.ChatOffSelf' : 'Education.Settings.ChatOnSelf'));
}
const { currentRoom } = useRoomState();
const roomId = computed(() => currentRoom.value?.roomId || '');
const chatOpen = ref(false);
const chatUnread = ref(0);
const chatUnreadLabel = computed(() => {
  if (chatOpen.value || chatUnread.value <= 0) return '';
  return chatUnread.value > 99 ? '99+' : String(chatUnread.value);
});
const chatPanelRef = ref<HTMLElement | null>(null);
const chatBarRef = ref<HTMLElement | null>(null);
const chatBox = ref({ x: 0, y: 0, w: 320, h: 480 });
const chatResizeDirs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
let chatOrigin = { ...chatBox.value };
let chatResizeDir = '';

function chatViewport(): Bounds {
  return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
}

function placeChatDefault(): void {
  const w = Math.min(320, window.innerWidth - 24);
  const h = Math.min(window.innerHeight * 0.68, 560);
  chatBox.value = {
    w,
    h,
    x: Math.max(0, window.innerWidth - w - 10),
    y: Math.max(0, window.innerHeight - h - 66),
  };
}

watch(isSmall, (small) => {
  if (!small) {
    chatOpen.value = false;
    chatUnread.value = 0;
    return;
  }
  placeChatDefault();
}, { immediate: true });

const CHAT_MIN_WIDTH = 280;
const CHAT_MIN_HEIGHT = 280;

/** Keeps the panel fully inside the window, shrinking it when it no longer fits. */
function containChatBox(box: { x: number; y: number; w: number; h: number }) {
  const bounds = chatViewport();
  const minW = Math.min(CHAT_MIN_WIDTH, bounds.width);
  const minH = Math.min(CHAT_MIN_HEIGHT, bounds.height);
  const w = Math.min(Math.max(box.w, minW), bounds.width);
  const h = Math.min(Math.max(box.h, minH), bounds.height);
  const next = clampBox(box.x, box.y, w, h, bounds);
  return { x: next.x, y: next.y, w, h };
}

function fitChatToViewport(): void {
  const next = containChatBox(chatBox.value);
  const current = chatBox.value;
  if (next.x === current.x && next.y === current.y && next.w === current.w && next.h === current.h) return;
  chatBox.value = next;
}

function onWindowResize(): void {
  if (!isSmall.value) return;
  fitChatToViewport();
}

onMounted(() => window.addEventListener('resize', onWindowResize));
onUnmounted(() => window.removeEventListener('resize', onWindowResize));

const { isDragging: chatMoving } = useDrag(chatBarRef, {
  // Bar controls (close, the mute label and its switch) act, not drag.
  handle: event => !(event.target as HTMLElement).closest('button, label'),
  onStart: () => {
    chatOrigin = { ...chatBox.value };
  },
  onDrag: ({ dx, dy }) => {
    chatBox.value = containChatBox({
      x: chatOrigin.x + dx,
      y: chatOrigin.y + dy,
      w: chatOrigin.w,
      h: chatOrigin.h,
    });
  },
});

const { isDragging: chatResizing } = useDrag(chatPanelRef, {
  handle: (event) => {
    chatResizeDir = (event.target as HTMLElement).closest('[data-dir]')?.getAttribute('data-dir') || '';
    return Boolean(chatResizeDir);
  },
  onStart: () => {
    chatOrigin = { ...chatBox.value };
  },
  onDrag: ({ dx, dy }) => {
    const bounds = chatViewport();
    const right = chatOrigin.x + chatOrigin.w;
    const bottom = chatOrigin.y + chatOrigin.h;
    let { w, h } = chatOrigin;
    if (chatResizeDir.includes('e') || chatResizeDir.includes('w')) {
      w += chatResizeDir.includes('w') ? -dx : dx;
    }
    if (chatResizeDir.includes('s') || chatResizeDir.includes('n')) {
      h += chatResizeDir.includes('n') ? -dy : dy;
    }
    const minW = Math.min(CHAT_MIN_WIDTH, bounds.width);
    const minH = Math.min(CHAT_MIN_HEIGHT, bounds.height);
    // The edge opposite the pointer stays put, so growth stops at the window.
    const maxW = chatResizeDir.includes('w')
      ? Math.min(bounds.width, right - bounds.x)
      : Math.min(bounds.width, bounds.x + bounds.width - chatOrigin.x);
    const maxH = chatResizeDir.includes('n')
      ? Math.min(bounds.height, bottom - bounds.y)
      : Math.min(bounds.height, bounds.y + bounds.height - chatOrigin.y);
    w = Math.min(Math.max(w, minW), Math.max(minW, maxW));
    h = Math.min(Math.max(h, minH), Math.max(minH, maxH));
    const x = chatResizeDir.includes('w') ? right - w : chatOrigin.x;
    const y = chatResizeDir.includes('n') ? bottom - h : chatOrigin.y;
    chatBox.value = containChatBox({ x, y, w, h });
  },
});

const chatDragging = computed(() => chatMoving.value || chatResizing.value);
const chatPanelStyle = computed(() => ({
  left: `${chatBox.value.x}px`,
  top: `${chatBox.value.y}px`,
  width: `${chatBox.value.w}px`,
  height: `${chatBox.value.h}px`,
}));

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
useSelfEnterAnnouncer(EDU_CLASS_EVENT_ID);
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

  /* clip, not hidden: a hidden box is still a scroll container, so the caret of a long
     annotation text line scrolls it and shifts the whole view. hidden is the fallback. */
  overflow: hidden;
  overflow: clip;
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

.education-workspace.is-small {
  grid-template: 'strip' auto 'main' minmax(0, 1fr) / minmax(0, 1fr);
  padding-top: 0;
}

.education-stage-strip {
  --strip-tile-width: 132px;

  box-sizing: border-box;
  display: flex;
  grid-area: strip;
  align-items: center;
  justify-content: center;
  height: calc(var(--strip-tile-width) * 9 / 16 + 16px);
  border-bottom: 1px solid var(--rk-border);
}

.education-stage-strip-track {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0 auto;
}

.education-stage-strip :deep(.edu-tile) {
  width: var(--strip-tile-width);
  height: auto;
  aspect-ratio: 16 / 9;
}

.education-stage-strip :deep(.edu-tile.is-speaking) {
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--rk-success) 32%, transparent),
    0 0 18px color-mix(in srgb, var(--rk-success) 28%, transparent),
    0 0 36px color-mix(in srgb, var(--rk-success) 16%, transparent);
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

  /* clip, not hidden: a hidden box is still a scroll container, so the caret of a long
     annotation text line scrolls it and shifts the share out of place. hidden is the fallback. */
  overflow: hidden;
  overflow: clip;
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
  font-size: 10px;
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
  font-size: 10px;
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

.education-float-chat-fab {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 220;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: color-mix(in srgb, var(--rk-bg-surface) 72%, transparent);
  backdrop-filter: saturate(180%) blur(20px);
  border: 1px solid var(--rk-border);
  border-radius: 50%;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}

.education-float-chat-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  box-sizing: border-box;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  line-height: 16px;
  color: #fff;
  text-align: center;
  pointer-events: none;
  background: var(--rk-danger);
  border-radius: 8px;
}

.education-float-chat-fab:hover,
.education-float-chat-fab.is-open {
  color: var(--rk-brand);
  border-color: var(--rk-brand);
}

.education-float-chat {
  position: fixed;
  z-index: 200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--rk-bg-surface);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18), 0 0 0 1px var(--rk-border);
}

.education-float-chat.is-dragging {
  user-select: none;
}

/* One header row: classroom title and mute-all on the left of the drag handle, close pinned right. */
.education-float-chat-bar {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 0 10px 0 14px;
  touch-action: none;
  cursor: grab;
}

.education-float-chat-bar-lead {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.education-float-chat-bar-title {
  font-size: var(--rk-fs-md);
  font-weight: 600;
  line-height: var(--rk-lh-sm, 18px);
  color: var(--rk-text-primary);
}

.education-float-chat-bar-silence {
  position: relative;
  z-index: 7;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  align-self: stretch;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  line-height: var(--rk-lh-sm, 18px);
  color: var(--rk-text-secondary);
  cursor: pointer;
}

/* 28x14 track, 11px knob, 14px travel. An odd knob cannot split the leftover
   3px into equal padding, so it sits on the track midline instead. The shadow
   is unshifted so it does not fill the lower gap. */
.education-float-chat-bar-silence :deep(.rk-switch-sm) {
  width: 28px;
  height: 14px;
  padding: 0;
}

.education-float-chat-bar-silence :deep(.rk-switch-sm .rk-switch-thumb) {
  position: absolute;
  top: 50%;
  left: 1.5px;
  width: 11px;
  height: 11px;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.22);
  transform: translateY(-50%);
}

.education-float-chat-bar-silence :deep(.rk-switch-on.rk-switch-sm .rk-switch-thumb) {
  transform: translate(14px, -50%);
}

.education-float-chat-close {
  position: relative;
  z-index: 7;
  display: grid;
  place-items: center;
  align-self: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.education-float-chat-close:hover {
  background: var(--rk-bg-hover);
}

.education-float-chat-body {
  flex: 1;
  min-height: 0;
}

/* 1v1 side chat jump circle (views-edu 1v1 .rk-chat-jump): same borderless
   raised chip as the H5 portrait chat and the small-class float chat. */
.education-chat :deep(.rk-list-jump) {
  color: #3a393a;
  background: var(--rk-bg-raised);
  border: 0;
  box-shadow: 0 2px 8px color-mix(in srgb, #1c1b1c 18%, transparent);
}

[data-rk-theme='dark'] .education-chat :deep(.rk-list-jump) {
  color: #c6c6c6;
  box-shadow: 0 2px 8px color-mix(in srgb, #000 18%, transparent);
}

/* Small-class float chat (views-edu 1v6 .rk-chat-notice / .rk-chat-jump). */
.education-float-chat :deep(.chat-notice-card) {
  border: 0;
}

.education-float-chat :deep(.rk-list-jump) {
  color: #3a393a;
  background: var(--rk-bg-raised);
  border: 0;
  box-shadow: 0 2px 8px color-mix(in srgb, #1c1b1c 18%, transparent);
}

[data-rk-theme='dark'] .education-float-chat :deep(.rk-list-jump) {
  color: #c6c6c6;
  box-shadow: 0 2px 8px color-mix(in srgb, #000 18%, transparent);
}

.education-float-chat-resize {
  position: absolute;
  z-index: 6;
  touch-action: none;
}

.education-float-chat-resize[data-dir='n'],
.education-float-chat-resize[data-dir='s'] {
  right: 8px;
  left: 8px;
  height: 6px;
  cursor: ns-resize;
}

.education-float-chat-resize[data-dir='n'] {
  top: 0;
}

.education-float-chat-resize[data-dir='s'] {
  bottom: 0;
}

.education-float-chat-resize[data-dir='e'],
.education-float-chat-resize[data-dir='w'] {
  top: 8px;
  bottom: 8px;
  width: 6px;
  cursor: ew-resize;
}

.education-float-chat-resize[data-dir='e'] {
  right: 0;
}

.education-float-chat-resize[data-dir='w'] {
  left: 0;
}

.education-float-chat-resize[data-dir='ne'],
.education-float-chat-resize[data-dir='nw'],
.education-float-chat-resize[data-dir='se'],
.education-float-chat-resize[data-dir='sw'] {
  width: 10px;
  height: 10px;
}

.education-float-chat-resize[data-dir='ne'] {
  top: 0;
  right: 0;
  cursor: nesw-resize;
}

.education-float-chat-resize[data-dir='nw'] {
  top: 0;
  left: 0;
  cursor: nwse-resize;
}

.education-float-chat-resize[data-dir='se'] {
  right: 0;
  bottom: 0;
  cursor: nwse-resize;
}

.education-float-chat-resize[data-dir='sw'] {
  bottom: 0;
  left: 0;
  cursor: nesw-resize;
}
</style>
