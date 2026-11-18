<template>
  <RoomKitProvider
    ref="hostRef"
    class="education-mobile-root"
    scene="education"
  >
    <div
      class="education-mobile"
      :data-orient="orientation"
      :data-mode="isSmall ? ClassMode.Small : ClassMode.OneToOne"
      :data-browser="isIOSChrome ? 'ios-chrome' : undefined"
    >
      <template v-if="phase === 'idle'">
        <header class="education-mobile-topbar">
          <div class="education-mobile-topbar-left">
            <!-- Leaving needs a confirm card; the popover anchors it under the topbar. -->
            <TUIPopover
              v-if="uiConfig.widgetVisible.LeaveRoomWidget !== false"
              :open="leaveMenuOpen"
              placement="bottom-start"
              :offset="8"
              :padded="false"
              @update:open="leaveMenuOpen = $event"
            >
              <button
                class="education-mobile-back"
                type="button"
                :aria-label="t('Education.Leave')"
                aria-haspopup="dialog"
                :aria-expanded="leaveMenuOpen"
              >
                <IconChevronRightMobile :size="20" />
              </button>
              <template #content>
                <EduLeaveCard
                  :title="t('Education.Leave.StudentTitle')"
                  :body="t('Education.Leave.StudentBody')"
                  :secondary-text="t('Education.Leave.StudentCancel')"
                  :confirm-text="t('Education.Leave.StudentConfirm')"
                  @secondary="leaveMenuOpen = false"
                  @confirm="exit"
                />
              </template>
            </TUIPopover>
            <CurrentEduRoomInfoMobile :room-name="roomName" :orientation="orientation" />
            <LocalNetworkInfoMobile :orientation="orientation" />
          </div>
          <div class="education-mobile-topbar-right">
            <MicButtonMobile v-if="uiConfig.widgetVisible.MicWidget !== false" :size="18" />
            <CameraButtonMobile v-if="uiConfig.widgetVisible.CameraWidget !== false" />
          </div>
        </header>

        <main class="education-mobile-body">
          <!-- The swap only moves the board and the teacher between grid areas, so neither
               the video element nor the board canvas is rebuilt. -->
          <div
            class="education-mobile-board"
            :class="boardOnStage ? 'is-main' : 'is-side'"
            :data-tile-role="boardOnStage ? 'stage' : 'thumb'"
          >
            <!-- The frame is the visible card. Small-class landscape sizes it 16:9
                 inside the stretched cell; every other layout lets it fill the board. -->
            <div class="education-mobile-board-frame">
              <template v-if="sharer">
                <RoomParticipantView
                  class="education-mobile-board-stream"
                  :participant="sharer"
                  :stream-type="VideoStreamType.Screen"
                  :fill-mode="FillMode.Fit"
                  :lazy-load="{ enable: false }"
                />
                <WhiteboardView :participant="sharer" :stream-type="VideoStreamType.Screen" />
                <!-- Read-only in the side seat, so the dock only rides the stage board. -->
                <WhiteboardToolsMobile v-if="boardOnStage && (isTeacher || selfBoardAuthorized) && uiConfig.widgetVisible.AnnotationWidget !== false" />
              </template>
              <div v-else class="education-mobile-board-empty">
                <EduStageEmptyArt />
                <span class="education-mobile-board-empty-text">{{ t('Education.StageEmpty') }}</span>
              </div>
            </div>
          </div>

          <ChatOverlayMobile
            v-if="chatChannel && uiConfig.widgetVisible.RoomChatWidget !== false"
            :key="chatChannel"
            class="education-mobile-barrage"
            :channel="chatChannel"
            collapsible
            :placeholder-key="isSmall ? 'Education.Chat.Placeholder' : 'Education.Chat.PlaceholderOnetoone'"
          />

          <div v-if="isSmall" class="education-mobile-rail">
            <ParticipantTileEduMobile :tile="teacherTile" tile-role="thumb" />
            <ParticipantTileEduMobile
              v-for="(tile, index) in railStudentTiles"
              :key="tile.participant?.userId ?? `empty-${index}`"
              :tile="tile"
              tile-role="thumb"
              :data-trophy-landing="tile.participant?.userId || undefined"
            />
          </div>
          <ParticipantTileEduMobile
            v-else
            :class="boardOnStage ? 'is-side' : 'is-main'"
            :tile="teacherTile"
            :tile-role="boardOnStage ? 'thumb' : 'stage'"
          />
          <ParticipantTileEduMobile
            v-if="!isSmall && studentTiles[0]"
            class="education-mobile-seat-student"
            :tile="studentTiles[0]"
            tile-role="thumb"
            :data-trophy-landing="studentTiles[0].participant?.userId || ''"
          />

          <section v-if="uiConfig.widgetVisible.RoomChatWidget !== false" class="education-mobile-chat">
            <RoomChat
              class="education-mobile-chat-body"
              mobile
              active
              is-hide-timestamp
              is-show-new-messages
              :is-show-notice="isSmall && orientation === Orientation.Portrait"
              :placeholder="t('Education.Chat.PlaceholderOnetoone')"
            >
              <template #meta="{ message }">
                <span
                  v-if="isTeacherMessage(message)"
                  class="education-mobile-teacher-tag"
                >
                  {{ t('Education.Teacher') }}
                </span>
              </template>
            </RoomChat>
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
import type { ComponentPublicInstance } from 'vue';
import { FillMode, RoomParticipantView, VideoStreamType, useRoomState } from 'tuikit-atomicx-vue3/room';
import {
  IconChevronRightMobile,
  RoomKitProvider,
  TUIDialog,
  TUIInput,
  TUILoading,
  TUIPopover,
  t,
  useKeyboardAvoidance,
  useOrientation,
  useUIConfig,
  Orientation,
} from '../../base';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  CameraButtonMobile,
  ChatOverlayMobile,
  CurrentEduRoomInfoMobile,
  LocalNetworkInfoMobile,
  MicButtonMobile,
  RoomChat,
  Trophy,
  WhiteboardToolsMobile,
  WhiteboardView,
} from '../../features';

import { EDU_CLASS_EVENT_ID } from '../../features/Chat/customMessage';
import { useSelfEnterAnnouncer } from '../../features/Chat/RoomChat/memberNotice';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomTips } from './hooks/useRoomTips';
import { useClassroomBoard } from './hooks/useClassroomBoard';
import { ClassMode, padStudentSeats, useClassroom } from './classroomData';
import EduStageEmptyArt from './EduStageEmptyArt.vue';
import EduLeaveCard from './EduLeaveCard.vue';
import ParticipantTileEduMobile from './ParticipantTileEduMobile.vue';

withDefaults(defineProps<{
  roomName?: string;
  /** Scheduled class length, in minutes. Reserved for API parity with the React kit;
      the mobile topbar no longer renders a separate class-length label. */
  durationMinutes?: number;
}>(), { roomName: '' });

const emit = defineEmits<{
  leave: [];
}>();

const { phase } = roomEntry;
const { uiConfig } = useUIConfig();
// Mounted before the join runs, so tips catch events a late joiner receives.
useRoomTips({ onLeave: () => emit('leave') });
// Each member announces their own arrival once the chat group accepts them.
useSelfEnterAnnouncer(EDU_CLASS_EVENT_ID);
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

// H5 is student-only in this phase, so leaving is the only exit and the card
// always carries the student copy.
const { leaveRoom } = useRoomExit();
const leaveMenuOpen = ref(false);

async function exit() {
  leaveMenuOpen.value = false;
  await leaveRoom();
  emit('leave');
}

const hostRef = ref<ComponentPublicInstance | null>(null);
const rootRef = computed<HTMLElement | null>(() => (hostRef.value?.$el as HTMLElement | null) ?? null);
const { orientation } = useOrientation(rootRef);

/* Chrome on iOS carries the CriOS token (all iOS browsers are WebKit shells).
   In landscape the browser already keeps the page inside the notch gutters,
   so the env() side insets it reports would double with our own padding; the
   landscape CSS drops them for this token. */
const isIOSChrome = /CriOS/.test(navigator.userAgent) && (
  /iPad|iPhone|iPod/.test(navigator.userAgent)
  // iPadOS 13+ desktop-mode UA; the education mobile view can run there too.
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

/* Freeze the box while typing (the board keeps its slot, the keyboard may
   cover its bottom) and publish the keyboard top as --rk-keyboard-offset;
   the scene slides on that variable below. The freeze also normalizes
   WebKit builds that resize the layout with the keyboard. Scoped to
   portrait: the barrage composer owns landscape typing, and the offset
   math itself is platform-agnostic (Android Chrome overlays the keyboard
   by default and honors interactive-widget in the demo viewport). */
useKeyboardAvoidance(rootRef, { enabled: () => orientation.value === Orientation.Portrait });

const { currentRoom } = useRoomState();

const chatChannel = computed(() => currentRoom.value?.roomId || '');

// The class-wide swap rides the teacher's metaData; the board and the teacher trade seats.
const { sharer, teacher, teacherTile, studentTiles, stage, classMode, isTeacher, selfBoardAuthorized } = useClassroom();
const isSmall = computed(() => classMode.value === ClassMode.Small);
// Only the portrait rail is a fixed six-seat grid. Landscape and PC list who has joined.
const railStudentTiles = computed(() => (
  isSmall.value && orientation.value === Orientation.Portrait
    ? padStudentSeats(studentTiles.value)
    : studentTiles.value
));
const boardOnStage = computed(() => stage.value.main === 'board');
const teacherId = computed(() => teacher.value?.userId || '');

function isTeacherMessage(message: { from?: { userID?: string } }) {
  return Boolean(message.from?.userID) && message.from?.userID === teacherId.value;
}
// The classroom dock replaces the plugin bar on H5, so the session starts without it.
useClassroomBoard(() => boardOnStage.value, () => rootRef.value, false);
</script>

<style scoped lang="scss" src="./EducationViewMobile.scss"></style>
