<template>
  <RoomKitProvider class="education-mobile-root" scene="education">
    <div class="education-mobile">
      <template v-if="phase === 'idle'">
        <header class="education-mobile-topbar">
          <div class="education-mobile-topbar-left">
            <button class="education-mobile-back" type="button" :aria-label="t('Education.Leave')" @click="exit">
              <IconChevronRightMobile :size="20" />
            </button>
            <CurrentRoomInfoMobile :room-name="roomName" />
            <LocalNetworkInfoMobile />
          </div>
          <div class="education-mobile-topbar-right">
            <MicButtonMobile />
            <CameraButtonMobile />
          </div>
        </header>

        <main class="education-mobile-body">
          <section class="education-mobile-seats">
            <ParticipantTileEduMobile :tile="teacherTile" />
            <ParticipantTileEduMobile :tile="studentTile" :data-trophy-landing="studentTile.participant?.userId || ''" />
          </section>

          <section class="education-mobile-stage">
            <div class="education-mobile-board" data-tile-role="stage">
              <RoomParticipantView
                v-if="sharer"
                class="education-mobile-board-stream"
                :participant="sharer"
                :stream-type="VideoStreamType.Screen"
                :fill-mode="FillMode.Fit"
                :lazy-load="{ enable: false }"
              />
              <p v-else class="education-mobile-board-empty">
                {{ t('Education.StageEmpty') }}
              </p>
            </div>
          </section>

          <section class="education-mobile-chat">
            <RoomChatMobile class="education-mobile-chat-body" />
          </section>
        </main>
        <!-- Scene-wide: the celebration plays from the same trophy count the roster shows. -->
        <Trophy />
      </template>

      <div v-if="loadingKey" class="education-mobile-join-loading">
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
        <p v-if="passwordErrorKey" class="education-mobile-join-error">
          {{ t(passwordErrorKey) }}
        </p>
      </TUIDialog>
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FillMode, RoomParticipantView, VideoStreamType } from 'tuikit-atomicx-vue3/room';
import {
  IconChevronRightMobile,
  RoomKitProvider,
  TUIDialog,
  TUIInput,
  TUILoading,
  t,
} from '../../base';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  CameraButtonMobile,
  CurrentRoomInfoMobile,
  LocalNetworkInfoMobile,
  MicButtonMobile,
  RoomChatMobile,
  Trophy,
} from '../../features';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomTips } from './hooks/useRoomTips';
import { useClassroomBoard } from './hooks/useClassroomBoard';
import { useClassroom } from './classroomData';
import ParticipantTileEduMobile from './ParticipantTileEduMobile.vue';

withDefaults(defineProps<{ roomName?: string }>(), { roomName: '' });

const emit = defineEmits<{
  leave: [];
}>();

const { phase } = roomEntry;
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

// H5 is student-only in this phase, so leaving is the only exit.
const { leaveRoom } = useRoomExit();

async function exit() {
  await leaveRoom();
  emit('leave');
}

// H5 always keeps the board in the stage; the teacher's swap only rearranges PC.
const { sharer, teacherTile, studentTile } = useClassroom();
useClassroomBoard();
</script>

<style scoped lang="scss">
.education-mobile-root {
  height: 100%;
}

.education-mobile-root :deep(.rk-root-slot) {
  height: 100%;
}

/* One tree for both orientations; the size container flips the body layout. */
.education-mobile {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
  background: var(--rk-bg-page);
  container-type: size;
}

.education-mobile-topbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: calc(48px + env(safe-area-inset-top));
  padding: env(safe-area-inset-top) 8px 0 2px;
  background: var(--rk-bg-surface);
  border-bottom: 1px solid var(--rk-border);
}

.education-mobile-topbar-left,
.education-mobile-topbar-right {
  display: flex;
  align-items: center;
  min-width: 0;
}

.education-mobile-topbar-left {
  gap: 4px;
}

.education-mobile-topbar-right {
  flex-shrink: 0;
  gap: 4px;
}

.education-mobile-back {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.education-mobile-back :deep(svg) {
  transform: rotate(180deg);
}

/* Bottom-bar chips shrunk to the classroom topbar's 32px. */
.education-mobile-topbar :deep(.toolbar-button-mobile) {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.education-mobile-topbar :deep(.toolbar-button-mobile-icon),
.education-mobile-topbar :deep(.toolbar-button-mobile-icon svg) {
  width: 18px;
  height: 18px;
}

.education-mobile-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.education-mobile-seats {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--rk-border);
}

.education-mobile-stage {
  flex-shrink: 0;
  background: var(--rk-bg-surface);
  border-bottom: 1px solid var(--rk-border);
}

.education-mobile-board {
  position: relative;
  width: 100%;
  max-height: 30vh;
  aspect-ratio: 16 / 9;
  margin: 0 auto;
  overflow: hidden;
}

.education-mobile-board-stream {
  width: 100%;
  height: 100%;
}

.education-mobile-board-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 24px;
  margin: 0;
  font-size: 12px;
  color: var(--rk-text-tertiary);
  text-align: center;
}

.education-mobile-chat {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  background: var(--rk-bg-surface);
}

.education-mobile-chat-body {
  flex: 1;
  min-height: 0;
}

/* Landscape: board on the left, seats stacked in a 224px rail. The floating chat is not built yet. */
@container (orientation: landscape) {
  .education-mobile-topbar {
    height: calc(40px + env(safe-area-inset-top));
  }

  .education-mobile-body {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr) 224px;
  }

  .education-mobile-stage {
    display: flex;
    grid-row: 1;
    grid-column: 1;
    align-items: center;
    justify-content: center;
    min-height: 0;
    background: var(--rk-bg-page);
    border-bottom: 0;
    container-type: size;
  }

  .education-mobile-board {
    width: min(100cqw, calc(100cqh * 16 / 9));
    max-height: 100%;
    background: var(--rk-bg-surface);
  }

  .education-mobile-seats {
    display: flex;
    flex-direction: column;
    grid-row: 1;
    grid-column: 2;
    gap: 6px;
    padding: 6px;
    overflow-y: auto;
    border-bottom: 0;
    border-left: 1px solid var(--rk-border);
  }

  .education-mobile-chat {
    display: none;
  }
}

.education-mobile-join-loading {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-bg-overlay);
  backdrop-filter: blur(8px);
}

.education-mobile-join-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--rk-danger);
  text-align: center;
}
</style>
