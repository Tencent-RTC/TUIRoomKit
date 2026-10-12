<template>
  <RoomKitProvider ref="hostRef" class="conference-root">
    <div class="conference-view">
      <template v-if="phase === 'idle'">
        <header class="conference-topbar">
          <div class="conference-topbar-left">
            <CurrentRoomInfo :narrow="size === 'thin'" />
            <LocalNetworkInfo />
            <CloudRecordingStatus />
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
            <RoomView :layout-template="layoutTemplate" />

            <div class="conference-toolbar">
              <MicButton />
              <CameraButton @open-setting="openSettings" />

              <OverflowToolbar class="conference-toolbar-overflow" :fullscreen="fullscreen" :minimizable="pipSupported" @minimize="miniViewRef?.minimize()" @fullscreen="toggleFullscreen">
                <ParticipantButton :active="openedPanels.includes('participants')" @click="sidePanelRef?.toggle('participants')" />
                <ChatButton
                  :active="openedPanels.includes('chat')"
                  :is-chat-active="activePanel === 'chat'"
                  @click="sidePanelRef?.toggle('chat')"
                />
                <ScreenShareButton />
                <CloudRecordingButton />
                <SettingButton :active="settingsOpen" @click="openSettings()" />
              </OverflowToolbar>

              <LeaveRoomButton @click="emit('leave')" />
            </div>
          </section>

          <RoomSidePanel
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
                <RoomChat
                  v-if="openedPanels.includes('chat')"
                  v-show="activeId === 'chat'"
                  :is-active="activeId === 'chat'"
                />
                <ParticipantList
                  v-if="openedPanels.includes('participants')"
                  v-show="activeId === 'participants'"
                />
              </slot>
            </template>
          </RoomSidePanel>
        </main>

        <SettingsDialog :open="settingsOpen" :active-tab="settingsTab" @select="settingsTab = $event" @close="settingsOpen = false" />

        <MiniWindow ref="miniViewRef" />
      </template>

      <JoinOverlay />
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useDeviceState, useLoginState, useRoomParticipantState, useRoomState, DeviceStatus } from 'tuikit-atomicx-vue3/room';
import { IconMembers, IconChat, RoomKitProvider, TUIAvatar, useFullscreen } from '../../base';
import { t } from '../../i18n';
import { roomEntry } from '../../core/session';
import {
  CameraButton,
  ChatButton,
  CloudRecordingButton,
  CloudRecordingStatus,
  CurrentRoomInfo,
  JoinOverlay,
  LayoutButton,
  LeaveRoomButton,
  LocalNetworkInfo,
  MicButton,
  MiniWindow,
  isPictureInPictureSupported,
  ParticipantButton,
  ParticipantList,
  RoomChat,
  RoomView,
  ScreenShareButton,
  SettingButton,
  SettingsDialog,
} from '../../features';
import type { SettingsTab } from '../../features';
import OverflowToolbar from '../../layouts/OverflowToolbar/index.vue';
import RoomSidePanel from '../../layouts/RoomSidePanel.vue';
import type { SidePanelTab } from '../../layouts/RoomSidePanel.vue';
import { useConferenceSize } from './hooks/useConferenceSize';
import { useRoomLayoutState } from './hooks/useRoomLayoutState';
import { useRoomTips } from './hooks/useRoomTips';

const emit = defineEmits<{
  leave: [];
}>();

const { phase } = roomEntry;
const hostRef = ref<ComponentPublicInstance | null>(null);
const rootRef = computed<HTMLElement | null>(() => (hostRef.value?.$el as HTMLElement | null) ?? null);

const { layoutTemplate, setLayoutTemplate } = useRoomLayoutState();
const { currentRoom } = useRoomState();
const { participantList } = useRoomParticipantState();
const participantCount = computed(() => currentRoom.value?.participantCount || participantList.value.length);
// Mounted before the join runs, unlike the meeting chrome below, which is what the
// recording notice inside needs to catch the start event a late joiner receives.
useRoomTips({ onLeave: () => emit('leave') });

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

const miniViewRef = ref<{ minimize: (options?: { pipOnly?: boolean }) => void } | null>(null);
// Without Document PiP there is nowhere useful to minimize to, so the menu entry stays hidden.
const pipSupported = isPictureInPictureSupported();
const { screenStatus } = useDeviceState();
watch(screenStatus, (status) => {
  if (status === DeviceStatus.On) {
    void miniViewRef.value?.minimize();
  }
});

const PANEL_TABS = computed<SidePanelTab[]>(() => [
  { id: 'chat', label: t('Room.ChatPanel'), icon: IconChat },
  { id: 'participants', label: t('Participants.PanelCount', { count: participantCount.value }), icon: IconMembers },
]);

const sidePanelRef = ref<InstanceType<typeof RoomSidePanel> | null>(null);
const openedPanels = ref<string[]>([]);
const activePanel = ref<string | null>(null);
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
  overflow: hidden;
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
  font-size: 12px;
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

.conference-stage > :not(.conference-toolbar) {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: visible;
}

.conference-toolbar {
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
</style>
