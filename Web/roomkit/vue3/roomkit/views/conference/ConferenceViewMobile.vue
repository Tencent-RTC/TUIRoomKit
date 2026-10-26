<template>
  <RoomKitProvider class="conference-mobile-root">
    <div class="conference-mobile">
      <template v-if="phase === 'idle'">
        <header class="conference-mobile-topbar">
          <CurrentRoomInfoMobile :room-name="roomName" />
          <LocalNetworkInfoMobile />
          <CloudRecordingStatusMobile />
          <div class="conference-mobile-leave">
            <TUIPopover
              :open="leaveMenuOpen"
              :disabled="!canEndRoom"
              placement="bottom-end"
              :offset="10"
              :padded="false"
              show-arrow
              @update:open="leaveMenuOpen = $event"
            >
              <TUIButton
                class="conference-mobile-leave-trigger"
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
                <IconPhone v-else class="conference-mobile-leave-icon" :size="15" />
              </TUIButton>
              <template #content>
                <div class="conference-mobile-leave-menu" role="menu">
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
        </header>

        <main class="conference-mobile-stage">
          <RoomViewMobile :hide-overlay="Boolean(uiConfig.participantViewUI)">
            <template v-if="uiConfig.participantViewUI" #participantViewUI="{ participant, streamType }">
              <component :is="uiConfig.participantViewUI" :participant="participant" :stream-type="streamType" />
            </template>
          </RoomViewMobile>
          <CaptionOverlayMobile
            v-if="isCaptionShown"
            class="conference-mobile-caption"
            @open-transcript="togglePanel('transcript')"
          />
        </main>

        <footer class="conference-mobile-toolbar">
          <MicButtonMobile />
          <CameraButtonMobile />
          <OverflowToolbarMobile class="conference-mobile-toolbar-overflow">
            <ParticipantButtonMobile :active="activePanel === 'participants'" @click="togglePanel('participants')" />
            <ChatButtonMobile
              :active="activePanel === 'chat'"
              :is-chat-active="activePanel === 'chat'"
              @click="togglePanel('chat')"
            />
            <!-- <AnnotationButtonMobile /> -->
            <CaptionEntryMobile :active="capViewOpen" @click="togglePanel('captions')" />
            <CloudRecordingButtonMobile />
            <SettingButtonMobile @click="settingsOpen = true" />
          </OverflowToolbarMobile>
        </footer>

        <TUIPopup
          :open="activePanel === 'chat'"
          height="84%"
          :title="t('Chat.Title')"
          @update:open="!$event && closePanel('chat')"
        >
          <RoomChatMobile class="conference-mobile-panel" :is-active="activePanel === 'chat'" />
        </TUIPopup>
        <TUIPopup
          :open="activePanel === 'participants'"
          height="84%"
          :title="t('Participants.PanelCount', { count: participantCount })"
          @update:open="!$event && closePanel('participants')"
        >
          <ParticipantListMobile class="conference-mobile-panel" />
        </TUIPopup>
        <TUIPopup
          :open="activePanel === 'captions'"
          height="auto"
          :title="t('AITools.Entry')"
          @update:open="!$event && closePanel('captions')"
        >
          <CaptionMenuMobile
            class="conference-mobile-caption-menu"
            :transcript-open="activePanel === 'transcript'"
            @transcription="closePanel('captions')"
            @open-transcript="activePanel = 'transcript'"
          />
        </TUIPopup>
        <TUIPopup
          :open="activePanel === 'transcript'"
          height="84%"
          :title="t('AITools.RealtimeMessageList')"
          @update:open="!$event && closePanel('transcript')"
        >
          <TranscriptListMobile class="conference-mobile-panel" @open-settings="captionSettingsOpen = true" />
        </TUIPopup>
        <CaptionSettingsMobile :open="captionSettingsOpen" @close="captionSettingsOpen = false" />
        <CaptionConfirmDialog />

        <SettingsDialogMobile :open="settingsOpen" @close="settingsOpen = false" />
      </template>

      <div v-if="loadingKey" class="conference-mobile-join-loading">
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
        <p v-if="passwordErrorKey" class="conference-mobile-join-error">
          {{ t(passwordErrorKey) }}
        </p>
      </TUIDialog>
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import {
  IconPhone,
  RoomKitProvider,
  TUIButton,
  TUIDialog,
  TUIInput,
  TUILoading,
  TUIPopover,
  TUIPopup,
  useUIConfig,
  t,
} from '../../base';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  AnnotationButtonMobile,
  CameraButtonMobile,
  CaptionConfirmDialog,
  CaptionEntryMobile,
  CaptionMenuMobile,
  CaptionOverlayMobile,
  CaptionSettingsMobile,
  ChatButtonMobile,
  CloudRecordingButtonMobile,
  CloudRecordingStatusMobile,
  CurrentRoomInfoMobile,
  LocalNetworkInfoMobile,
  MicButtonMobile,
  ParticipantButtonMobile,
  ParticipantListMobile,
  RoomChatMobile,
  RoomViewMobile,
  SettingButtonMobile,
  SettingsDialogMobile,
  TranscriptListMobile,
  useASRState,
  useSubtitleViewState,
} from '../../features';
import OverflowToolbarMobile from '../../layouts/OverflowToolbarMobile/index.vue';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomTips } from './hooks/useRoomTips';

withDefaults(defineProps<{ roomName?: string }>(), { roomName: '' });

const emit = defineEmits<{
  leave: [];
}>();

const { phase } = roomEntry;
const { uiConfig } = useUIConfig();
const { currentRoom } = useRoomState();
const { participantList } = useRoomParticipantState();
const participantCount = computed(() => currentRoom.value?.participantCount || participantList.value.length);
// Mounted before the join runs, so the recording notice catches the start event a late joiner receives.
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

const activePanel = ref<string | null>(null);
const settingsOpen = ref(false);
const captionSettingsOpen = ref(false);
const { isCaptionShown } = useASRState();
const { capViewOpen } = useSubtitleViewState();

watch(activePanel, (id) => {
  if (id !== 'transcript') {
    captionSettingsOpen.value = false;
  }
});

function togglePanel(id: string) {
  activePanel.value = activePanel.value === id ? null : id;
}

function closePanel(id: string) {
  if (activePanel.value === id) {
    activePanel.value = null;
  }
}
</script>

<style scoped lang="scss">
.conference-mobile-root {
  height: 100%;
}

.conference-mobile-root :deep(.rk-root-slot) {
  height: 100%;
}

.conference-mobile {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
}

.conference-mobile-topbar {
  position: relative;
  z-index: 5;
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
  height: calc(44px + env(safe-area-inset-top));
  padding: env(safe-area-inset-top) 16px 0;
}

.conference-mobile-leave {
  margin-left: auto;
}

.rk-btn.conference-mobile-leave-trigger {
  min-width: 54px;
  height: 28px;
  padding: 0 14px;
  font-size: 14px;
  border: none;
  border-radius: var(--rk-radius-pill);
}

.rk-btn.conference-mobile-leave-trigger.is-open,
.rk-btn.conference-mobile-leave-trigger.is-open:hover {
  font-weight: 500;
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-text-primary) 12%, transparent);
}

.conference-mobile-leave-icon {
  transform: rotate(135deg);
}

.conference-mobile-leave-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 176px;
  padding: 8px;
}

.conference-mobile-leave-menu > .rk-btn {
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  border-radius: 10px;
}

.conference-mobile-leave-menu > .rk-btn-ghost {
  background: color-mix(in srgb, var(--rk-text-primary) 6%, transparent);
}

.conference-mobile-join-loading {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-bg-overlay);
  backdrop-filter: blur(8px);
}

.conference-mobile-join-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--rk-danger);
  text-align: center;
}

.conference-mobile-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.conference-mobile-toolbar {
  position: relative;
  z-index: 5;
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  justify-content: center;
  height: calc(64px + env(safe-area-inset-bottom));
  padding: 0 16px env(safe-area-inset-bottom);
}

.conference-mobile-toolbar > :not(.conference-mobile-toolbar-overflow) {
  flex-shrink: 0;
}

/* The panels pad and scroll themselves, so they bleed over TUIPopup's 16px body padding. */
.conference-mobile-panel {
  height: 100%;
  margin: 0 -16px;
}

.conference-mobile-caption-menu {
  margin: 0 -16px;
}
</style>
