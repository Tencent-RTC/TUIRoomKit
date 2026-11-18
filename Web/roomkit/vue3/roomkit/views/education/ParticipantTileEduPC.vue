<template>
  <div
    class="edu-tile"
    :class="{
      'is-waiting': !tile.participant,
      'is-speaking': isSpeaking,
      'is-teacher': tile.seat === 'teacher',
    }"
    :data-tile-role="tileRole"
  >
    <RoomParticipantView
      v-if="tile.participant"
      class="edu-tile-view"
      :participant="tile.participant"
      :stream-type="VideoStreamType.Camera"
      :fill-mode="tileRole === 'stage' ? FillMode.Fit : FillMode.Fill"
      :lazy-load="{ enable: false }"
    >
      <template #participantViewUI>
        <component
          :is="customUI"
          v-if="customUI"
          :participant="tile.participant"
          :stream-type="VideoStreamType.Camera"
        />
        <div v-else class="edu-tile-overlay">
          <div v-if="!tile.cameraOn" class="edu-tile-mask">
            <div class="edu-tile-face">
              <TUIAvatar :src="tile.avatarUrl" :alt="tile.name" :size="faceSize" />
            </div>
          </div>

          <span v-if="tile.weakNetwork" class="edu-tile-net" :aria-label="t('Education.WeakNetwork')">
            <IconNet :size="12" />
          </span>

          <span v-if="tile.trophyCount > 0" class="edu-tile-trophy">
            <IconTrophyUi :size="10" />
            <b>×{{ tile.trophyCount }}</b>
          </span>

          <div class="edu-tile-meta">
            <span class="edu-tile-mic" :aria-label="t(tile.micOn ? 'Education.MicOn' : 'Education.MicOff')">
              <IconMic v-if="tile.micOn" :size="14" />
              <IconMicOff v-else :size="14" />
              <span
                v-if="isSpeaking"
                class="edu-tile-mic-core"
                :style="{ clipPath: `inset(${waveInset}% 0 0 0)` }"
              />
            </span>
            <span class="edu-tile-name">{{ tile.name }}</span>
            <em v-if="tile.seat === 'teacher'" class="edu-tile-tag">{{ t('Education.Teacher') }}</em>
          </div>

          <div v-if="showActions" class="edu-tile-actions">
            <button
              type="button"
              :class="{ 'is-on': tile.boardAuthorized }"
              :aria-label="t(tile.boardAuthorized ? 'Education.RevokeBoard' : 'Education.AuthorizeBoard')"
              :title="t(tile.boardAuthorized ? 'Education.RevokeBoard' : 'Education.AuthorizeBoard')"
              @click="actions.toggleBoardAuth(tile)"
            >
              <IconEduWhiteboardAuth v-if="tile.boardAuthorized" :size="14" />
              <IconEduWhiteboardAuthOff v-else :size="14" />
            </button>
            <button
              type="button"
              :aria-label="t('Education.GiveTrophy')"
              :title="t('Education.GiveTrophy')"
              @click="actions.reward(tile)"
            >
              <IconTrophyUi :size="14" />
            </button>
            <button
              type="button"
              :aria-label="t(tile.micOn ? 'Participants.MicClose' : 'Education.RequestMic')"
              :title="t(tile.micOn ? 'Participants.MicClose' : 'Education.RequestMic')"
              @click="actions.toggleMic(tile)"
            >
              <IconMic v-if="tile.micOn" :size="14" />
              <IconMicOff v-else :size="14" />
            </button>
            <button
              type="button"
              :aria-label="t(tile.cameraOn ? 'Participants.CamClose' : 'Education.RequestCamera')"
              :title="t(tile.cameraOn ? 'Participants.CamClose' : 'Education.RequestCamera')"
              @click="actions.toggleCam(tile)"
            >
              <IconCam v-if="tile.cameraOn" :size="14" />
              <IconCamOff v-else :size="14" />
            </button>
          </div>
        </div>
      </template>
    </RoomParticipantView>

    <div v-else class="edu-tile-wait">
      <img class="edu-tile-wait-figure" :src="tile.seat === 'teacher' ? waitTeacher : waitStudent" alt="" draggable="false">
      <span class="edu-tile-wait-label">
        {{ t('Education.Coming', { name: t(tile.seat === 'teacher' ? 'Education.Teacher' : 'Education.Student') }) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  FillMode,
  RoomParticipantView,
  VideoStreamType,
  useRoomParticipantState,
} from 'tuikit-atomicx-vue3/room';
import {
  IconCam,
  IconCamOff,
  IconEduWhiteboardAuth,
  IconEduWhiteboardAuthOff,
  IconMic,
  IconMicOff,
  IconNet,
  IconTrophyUi,
  TUIAvatar,
  t,
  useUIConfig,
} from '../../base';
import { useClassroom } from './classroomData';
import type { TileData } from './classroomData';
import { useClassroomActions } from './classroomActions';
import waitStudent from './assets/wait-student.svg';
import waitTeacher from './assets/wait-teacher.svg';

const props = withDefaults(defineProps<{
  tile: TileData;
  /** `stage` fills the main area and letterboxes; `thumb` is the 16:9 rail seat. */
  tileRole: 'stage' | 'thumb';
  /** Bottom stage strip: smaller face. */
  inStrip?: boolean;
}>(), { inStrip: false });

const { uiConfig } = useUIConfig();
const { isTeacher } = useClassroom();
const actions = useClassroomActions();

const customUI = computed(() => uiConfig.participantViewUI);
const showActions = computed(() => isTeacher.value && props.tile.seat === 'student');
const faceSize = computed(() => {
  if (props.inStrip) {
    return 28;
  }
  return props.tileRole === 'stage' ? 120 : 72;
});

const { speakingUsers, localParticipant } = useRoomParticipantState();

/** Conversation sits far below the reported ceiling of 100, so the bar tops out here. */
const SPEECH_PEAK = 40;
const WAVE_MIN_SCALE = 0.3;
const WAVE_MAX_SCALE = 1;

const volume = computed(() => {
  const userId = props.tile.participant?.userId;
  if (!userId) {
    return 0;
  }
  const reported = speakingUsers.value.get(userId) ?? 0;
  // The engine reports the local user under "", so a self tile misses its own level.
  if (userId !== localParticipant.value?.userId) {
    return reported;
  }
  return Math.max(reported, speakingUsers.value.get('') ?? 0);
});

/** Engine reports 0 when silent, so any positive volume counts as speaking. */
const isSpeaking = computed(() => props.tile.micOn && volume.value > 0);

/** How much of the fill is cut away from the top; the rest reads as the level. */
const waveInset = computed(() => {
  const level = Math.min(volume.value / SPEECH_PEAK, 1);
  const scale = WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level;
  return ((1 - scale) * 100).toFixed(1);
});
</script>

<style scoped lang="scss">
.edu-tile {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--rk-bg-camera-off);
  border-radius: 10px;
  container-type: size;
}

.edu-tile-view {
  width: 100%;
  height: 100%;
}

.edu-tile-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

/* Same frame as the avatar: covers the player, which paints its own black a frame later. */
.edu-tile-mask {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: var(--rk-bg-camera-off);
  border-radius: inherit;
}

.edu-tile-face {
  position: absolute;
  top: 44%;
  left: 50%;
  z-index: 1;
  display: flex;
  transform: translate(-50%, -50%);
}

.edu-tile-net {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 6;
  display: inline-flex;
  color: var(--rk-danger);
}

.edu-tile-trophy {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 4;
  display: inline-flex;
  gap: 2px;
  align-items: center;
  padding: 2px 4px;
  font-size: var(--rk-fs-xs);
  color: var(--rk-warning);
  background: rgba(0, 0, 0, 0.45);
  border-radius: 8px;
}

.edu-tile-trophy b {
  font-weight: 500;
}

.edu-tile-meta {
  position: absolute;
  bottom: 6px;
  left: 6px;
  z-index: 2;
  display: flex;
  gap: 4px;
  align-items: center;
  max-width: calc(100% - 12px);
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
}

.edu-tile-mic {
  position: relative;
  display: inline-flex;
  flex: none;
  width: 14px;
  height: 14px;
}

.edu-tile-mic :deep(svg) {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

/* Box is in IconMic's 16-unit viewBox: it matches the capsule's hollow cavity
   (x 5.5-10.5, y 2-10.5) so the fill never escapes the outline.
   Update it if the icon path changes.
   The level is clipped from the top, since scaling would flatten the round bottom. */
.edu-tile-mic-core {
  position: absolute;
  top: calc(2 / 16 * 100%);
  left: calc(5.5 / 16 * 100%);
  z-index: 0;
  width: calc(5 / 16 * 100%);
  height: calc(8.5 / 16 * 100%);
  background: var(--rk-success);
  border-radius: 999px;
  transition: clip-path 0.2s ease-out;
}

.edu-tile-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edu-tile-tag {
  flex: none;
  padding: 0 6px;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  line-height: 16px;
  color: var(--rk-brand);
  background: color-mix(in srgb, var(--rk-brand) 18%, transparent);
  border-radius: 4px;
}

.edu-tile-actions {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 6;
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  padding: 5px;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.46);
  opacity: 0;
  transition: opacity 0.12s ease;
}

.edu-tile:hover .edu-tile-actions,
.edu-tile:has(:focus-visible) .edu-tile-actions {
  pointer-events: auto;
  opacity: 1;
}

.edu-tile:hover .edu-tile-overlay:has(.edu-tile-actions) .edu-tile-meta,
.edu-tile:has(:focus-visible) .edu-tile-overlay:has(.edu-tile-actions) .edu-tile-meta {
  opacity: 0;
}

.edu-tile-actions button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  background: rgba(255, 255, 255, 0.12);
  border: 0;
  border-radius: 6px;
}

.edu-tile-actions button:hover,
.edu-tile-actions button.is-on {
  color: #fff;
  background: rgba(255, 255, 255, 0.22);
}

.edu-tile-wait {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 12px;
  overflow: hidden;
}

.edu-tile-wait-figure {
  display: block;
  width: auto;
  max-width: 88%;
  height: clamp(32px, 48cqh, 58px);
  object-fit: contain;
}

.edu-tile-wait-label {
  max-width: 100%;
  overflow: hidden;
  font-size: clamp(10px, 13cqmin, 14px);
  font-weight: 500;
  color: var(--rk-text-secondary);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@container (min-height: 120px) {
  .edu-tile-wait {
    gap: 8px;
  }

  .edu-tile-wait-figure {
    height: clamp(64px, 46cqh, 108px);
  }
}

@container (max-height: 52px) {
  .edu-tile-wait-label {
    display: none;
  }

  .edu-tile-wait-figure {
    height: clamp(22px, 64cqh, 30px);
  }
}
</style>
