<template>
  <RoomKitProvider ref="hostRef" class="conference-root">
    <div class="conference-view">
      <template v-if="phase === 'idle'">
        <header class="conference-topbar">
          <div class="conference-topbar-left">
            <CurrentRoomInfoPC :narrow="size === 'thin'" />
            <LocalNetworkInfoPC />
            <CloudRecordingStatusPC />
          </div>

          <div class="conference-topbar-right">
            <LayoutButton :layout-template="layoutTemplate" @update:layout-template="setLayoutTemplate" />
            <div v-if="localUserName" class="conference-user">
              <TUIAvatar :size="20" :src="loginUserInfo?.avatarUrl" :alt="localUserName" />
              <span class="conference-user-name" :title="localUserName">{{ localUserName }}</span>
            </div>
          </div>
        </header>

        <main class="conference-body">
          <section class="conference-stage" :class="{ 'conference-stage-docked': size === 'wide' && openedPanels.length > 0 }">
            <RoomViewPC
              :layout-template="layoutTemplate"
              :stage-stream="stageStream"
              :hide-overlay="Boolean(uiConfig.participantViewUI)"
              @stream-double-click="handleStreamDoubleClick"
            >
              <template #participantViewUI="{ participant, streamType, tileRole }">
                <WhiteboardView :participant="participant" :stream-type="streamType" />
                <component
                  :is="uiConfig.participantViewUI"
                  v-if="uiConfig.participantViewUI"
                  :participant="participant"
                  :stream-type="streamType"
                />
                <!-- A thumbnail is too small to draw on; the room holds the stage while annotating. -->
                <div v-if="tileRole === 'stage'" class="conference-share-actions">
                  <AnnotationButton :participant="participant" :stream-type="streamType" />
                </div>
              </template>
            </RoomViewPC>
            <CaptionOverlay
              v-if="isCaptionShown"
              :transcript-open="openedPanels.includes('transcript')"
              @toggle-transcript="sidePanelRef?.toggle('transcript')"
            />

            <div class="conference-toolbar">
              <MicButton />
              <CameraButton @open-setting="openSettings" />

              <OverflowToolbarPC class="conference-toolbar-overflow" :fullscreen="fullscreen" :minimizable="pipSupported" @minimize="miniViewRef?.minimize()" @fullscreen="toggleFullscreen">
                <ParticipantButtonPC :active="openedPanels.includes('participants')" @click="sidePanelRef?.toggle('participants')" />
                <ChatButton
                  :active="openedPanels.includes('chat')"
                  :is-chat-active="activePanel === 'chat'"
                  @click="sidePanelRef?.toggle('chat')"
                />
                <ScreenShareButton>
                  <WhiteboardButton />
                </ScreenShareButton>
                <CloudRecordingButtonPC />
                <CaptionButton
                  :active="isCaptionShown || openedPanels.includes('transcript')"
                  :transcript-open="openedPanels.includes('transcript')"
                  @toggle-transcript="toggleTranscriptPanel"
                />
                <SettingButtonPC :active="settingsOpen" @click="openSettings()" />
              </OverflowToolbarPC>

              <TUIPopover
                :open="leaveMenuOpen"
                :disabled="!canEndRoom"
                placement="top-end"
                :offset="14"
                :padded="false"
                show-arrow
                @update:open="leaveMenuOpen = $event"
              >
                <TUIButton
                  class="conference-leave"
                  :class="{ 'is-open': leaveMenuOpen }"
                  variant="danger"
                  :aria-label="leaveMenuOpen ? t('Room.Cancel') : t('Room.Leave')"
                  :aria-haspopup="canEndRoom ? 'menu' : undefined"
                  :aria-expanded="canEndRoom ? leaveMenuOpen : undefined"
                  @click="!canEndRoom && exit('leave')"
                >
                  <template v-if="leaveMenuOpen">
                    {{ t('Room.Cancel') }}
                  </template>
                  <IconPhone v-else class="conference-leave-icon" :size="22" />
                </TUIButton>
                <template #content>
                  <div class="conference-leave-menu" role="menu">
                    <TUIButton variant="danger" block role="menuitem" @click="exit('end')">
                      {{ t('Room.End') }}
                    </TUIButton>
                    <TUIButton variant="ghost" block role="menuitem" @click="exit('leave')">
                      {{ t('Room.Leave') }}
                    </TUIButton>
                  </div>
                </template>
              </TUIPopover>
            </div>
          </section>

          <RoomSidePanelPC
            ref="sidePanelRef"
            class="conference-side-panel"
            :class="{ 'conference-side-panel-floating': size !== 'wide', 'is-closed': !openedPanels.length }"
            :tabs="PANEL_TABS"
            :opened="openedPanels"
            :active-id="activePanel"
            @update:opened="openedPanels = $event"
            @update:active-id="activePanel = $event"
          >
            <template #default="{ activeId }">
              <slot name="panel" :active-id="activeId" :opened="openedPanels">
                <RoomChatPC
                  v-if="openedPanels.includes('chat')"
                  v-show="activeId === 'chat'"
                  :is-active="activeId === 'chat'"
                />
                <ParticipantListPC
                  v-if="openedPanels.includes('participants')"
                  v-show="activeId === 'participants'"
                />
                <TranscriptList
                  v-if="openedPanels.includes('transcript')"
                  v-show="activeId === 'transcript'"
                />
              </slot>
            </template>
          </RoomSidePanelPC>
        </main>

        <SettingsDialogPC :open="settingsOpen" :active-tab="settingsTab" @select="settingsTab = $event" @close="settingsOpen = false" />

        <MiniWindow ref="miniViewRef" />
      </template>

      <div v-if="loadingKey" class="conference-join-loading">
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
        <p v-if="passwordErrorKey" class="conference-join-error">
          {{ t(passwordErrorKey) }}
        </p>
      </TUIDialog>
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import {
  IconMembers,
  IconChat,
  IconAITranscription,
  IconPhone,
  RoomKitProvider,
  TUIAvatar,
  TUIButton,
  TUIDialog,
  TUIInput,
  TUILoading,
  TUIPopover,
  useFullscreen,
  useUIConfig,
  t,
} from '../../base';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  AnnotationButton,
  CameraButton,
  CaptionButton,
  CaptionOverlay,
  ChatButton,
  CloudRecordingButtonPC,
  CloudRecordingStatusPC,
  CurrentRoomInfoPC,
  LayoutButton,
  LocalNetworkInfoPC,
  MicButton,
  MiniWindow,
  isPictureInPictureSupported,
  ParticipantButtonPC,
  ParticipantListPC,
  RoomChatPC,
  RoomViewPC,
  ScreenShareButton,
  SettingButtonPC,
  SettingsDialogPC,
  TranscriptList,
  useASRState,
  WhiteboardButton,
  WhiteboardView,
} from '../../features';
import type { SettingsTab } from '../../features';
import OverflowToolbarPC from '../../layouts/OverflowToolbarPC/index.vue';
import RoomSidePanelPC from '../../layouts/RoomSidePanelPC/RoomSidePanelPC.vue';
import type { SidePanelTab } from '../../layouts/RoomSidePanelPC/RoomSidePanelPC.vue';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { useConferenceSize } from './hooks/useConferenceSize';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomLayoutState } from './hooks/useRoomLayoutState';
import { useRoomTips } from './hooks/useRoomTips';

const emit = defineEmits<{
  leave: [];
}>();

const { phase } = roomEntry;
const hostRef = ref<ComponentPublicInstance | null>(null);
const rootRef = computed<HTMLElement | null>(() => (hostRef.value?.$el as HTMLElement | null) ?? null);

const { layoutTemplate, stageStream, setLayoutTemplate, handleStreamDoubleClick } = useRoomLayoutState();
const { uiConfig } = useUIConfig();
const { currentRoom } = useRoomState();
const { participantList } = useRoomParticipantState();
const participantCount = computed(() => currentRoom.value?.participantCount || participantList.value.length);
// Mounted before the join runs, unlike the meeting chrome below, which is what the
// recording notice inside needs to catch the start event a late joiner receives.
useRoomTips({ onLeave: () => emit('leave') });
useAutoPlayDialog();

const LOADING_KEYS: Partial<Record<RoomEntryPhase, string>> = {
  login: 'RoomEntry.LoggingIn',
  profile: 'RoomEntry.Preparing',
  joining: 'RoomEntry.Joining',
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

async function exit(action: 'leave' | 'end') {
  leaveMenuOpen.value = false;
  await (action === 'end' ? endRoom() : leaveRoom());
  emit('leave');
}

const { loginUserInfo } = useLoginState();
const localUserName = computed(() => loginUserInfo.value?.userName || loginUserInfo.value?.userId || '');

const settingsOpen = ref(false);
const settingsTab = ref<SettingsTab>('audio');

function openSettings(tab: SettingsTab = 'audio') {
  settingsTab.value = tab;
  settingsOpen.value = true;
}

const { size } = useConferenceSize(rootRef);
const { fullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);

const miniViewRef = ref<{
  minimize: (options?: { pipOnly?: boolean; auto?: boolean }) => void;
  dismissAuto: () => void;
} | null>(null);
// Without Document PiP there is nowhere useful to minimize to, so the menu entry stays hidden.
const pipSupported = isPictureInPictureSupported();

const { isCaptionShown } = useASRState();

const PANEL_TABS = computed<SidePanelTab[]>(() => [
  { id: 'chat', label: t('Room.ChatPanel'), icon: IconChat },
  { id: 'participants', label: t('Participants.PanelCount', { count: participantCount.value }), icon: IconMembers },
  { id: 'transcript', label: t('AITools.RealtimeMessageList'), icon: IconAITranscription },
]);

const sidePanelRef = ref<InstanceType<typeof RoomSidePanelPC> | null>(null);
const openedPanels = ref<string[]>([]);
const activePanel = ref<string | null>(null);

/**
 * The caption menu's transcript action is labelled by state ("关闭文字转写" /
 * "显示文字转写"), so the behaviour must always match the label: when the
 * panel is open — even while another tab is active — the action CLOSES it.
 * `toggle()` cannot do that: with another tab active it would focus the
 * transcript tab instead of closing it.
 */
function toggleTranscriptPanel() {
  if (openedPanels.value.includes('transcript')) {
    sidePanelRef.value?.close('transcript');
    return;
  }
  sidePanelRef.value?.open('transcript');
}
</script>

<style scoped lang="scss">
.conference-root {
  height: 100%;
}

.conference-root :deep(.rk-root-slot) {
  height: 100%;
}

.conference-view {
  /* `overflow: hidden` clips at the padding box, so anything that slides out to
     the right stays visible across this gutter unless it also clears it. */
  --conference-gutter: 12px;

  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  padding: 0 var(--conference-gutter) var(--conference-gutter);

  /* clip, not hidden: the parked side panel gives a hidden box scroll room, and the caret
     of a long whiteboard text line scrolls the whole view into it. hidden is the fallback. */
  overflow: hidden;
  overflow: clip;
  color: var(--rk-text-primary);
  background: var(--rk-bg-page);
}

.conference-topbar {
  display: flex;
  flex: 0 0 36px;
  align-items: stretch;
  justify-content: space-between;
}

.conference-topbar-left,
.conference-topbar-right {
  display: flex;
  align-items: center;
  min-width: 0;
}

.conference-topbar-left {
  gap: 12px;
}

.conference-topbar-right {
  gap: 8px;
}

/* Sits on the topbar chip scale: 24px tall, the avatar filling it edge to edge on the left. */
.conference-user {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  height: 24px;
  padding: 2px 10px 2px 2px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  color: var(--rk-text-primary);

  /* Display only: the name is not a text field and not clickable, so neither the
     caret nor a pointer belongs here. */
  cursor: default;
  user-select: none;

  /* Same corner as the preconference topbar user chip */
  border-radius: 10px;
  transition: background 0.15s;
}

.conference-user:hover {
  background: var(--rk-bg-hover);
}

.conference-user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conference-body {
  /* The stage animates the room it gives up; the panel only ever slides. Both
     read the same width and timing so the two edges travel together. */
  --side-panel-width: 340px;
  --side-panel-gap: 8px;

  /* Material's standard easing: no overshoot, settles flat. Meet uses the same
     shape for its side panel, which reads quicker than a long-tailed ease-out. */
  --side-panel-motion: 0.3s cubic-bezier(0.2, 0, 0, 1);

  position: relative;
  display: flex;
  flex: 1;
  align-items: stretch;
  min-height: 0;
}

/* Stays out of the flex sizing so its width never collapses: squeezing it would
   reflow the tab row and the message list on every frame of the animation. */
.conference-side-panel {
  /* Sitting on the body's right edge, sliding out by its own width alone would
     park the panel inside the view gutter instead of past the clip. */
  --side-panel-exit-gap: var(--conference-gutter);

  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: min(var(--side-panel-width), 100%);
  height: 100%;
  overflow: hidden;
  background: var(--rk-bg-surface);
  border-radius: 14px;
  transition:
    transform var(--side-panel-motion),
    box-shadow var(--side-panel-motion);
}

/* Floating tier only: the stage keeps its full width there, so the panel has to
   read as a layer above it. The shadow fades out with the slide, since its blur
   alone still reaches into the gutter. */
.conference-side-panel-floating {
  box-shadow: var(--rk-shadow-pop);
}

.conference-side-panel-floating.is-closed {
  box-shadow: none;
}

/* Width rather than `flex: 1`, so the room it yields to the docked panel is an
   animatable value instead of a layout side effect. */
.conference-stage {
  position: relative;
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  overflow: hidden;
  background: var(--rk-bg-surface);
  border-radius: 14px;
  transition: width var(--side-panel-motion);
}

.conference-stage-docked {
  width: calc(100% - var(--side-panel-width) - var(--side-panel-gap));
}

.conference-stage > :not(.conference-toolbar):not(.conference-caption) {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: visible;
}

/* Top-right corner of the share tile, mirroring the sharing badge on the left. Only the
   button takes the pointer, so the board or annotation underneath keeps every other press. */
.conference-share-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.conference-toolbar {
  position: relative;
  z-index: 3;
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 56px;
  padding: 0 12px;
  overflow: hidden;
}

.conference-toolbar > :not(.conference-toolbar-overflow) {
  flex-shrink: 0;
}

.conference-toolbar-overflow {
  flex: 0 1 auto;
  min-width: 0;
  padding: 0;
}

/* Fixed width so the bar does not shift when the hangup icon swaps for the cancel
   label; 70px still fits the widest one, en-US "Cancel". */
.rk-btn.conference-leave {
  width: 70px;
  height: 44px;
  padding: 0;
  font-size: 14px;
  border: none;
  border-radius: var(--rk-radius-pill);
}

.rk-btn.conference-leave.is-open,
.rk-btn.conference-leave.is-open:hover {
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-text-primary) 12%, transparent);
}

.conference-leave-icon {
  transform: rotate(135deg) scale(0.78);
}

.conference-leave-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
  padding: 8px;
}

.conference-leave-menu > .rk-btn {
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 10px;
}

.conference-leave-menu > .rk-btn-ghost {
  background: color-mix(in srgb, var(--rk-text-primary) 6%, transparent);
}

.conference-join-loading {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-bg-overlay);
  backdrop-filter: blur(8px);
}

.conference-join-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--rk-danger);
  text-align: center;
}
</style>
