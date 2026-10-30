<template>
  <div
    class="edu-tile-mobile"
    :class="{ 'is-waiting': !tile.participant, 'is-authorized': tile.boardAuthorized && !customUI }"
    data-tile-role="thumb"
  >
    <RoomParticipantView
      v-if="tile.participant"
      class="edu-tile-mobile-view"
      :participant="tile.participant"
      :stream-type="VideoStreamType.Camera"
      :fill-mode="FillMode.Fill"
      :lazy-load="{ enable: false }"
    >
      <template #participantViewUI>
        <component
          :is="customUI"
          v-if="customUI"
          :participant="tile.participant"
          :stream-type="VideoStreamType.Camera"
        />
        <div v-else class="edu-tile-mobile-overlay">
          <div v-if="!tile.cameraOn" class="edu-tile-mobile-face">
            <TUIAvatar :src="tile.avatarUrl" :alt="tile.name" :size="36" />
          </div>

          <span v-if="tile.weakNetwork" class="edu-tile-mobile-net" :aria-label="t('Education.WeakNetwork')">
            <IconNet :size="12" />
          </span>

          <span v-if="tile.trophyCount > 0" class="edu-tile-mobile-trophy">
            <IconTrophyUi :size="10" />
            <b>×{{ tile.trophyCount }}</b>
          </span>

          <div class="edu-tile-mobile-meta">
            <span class="edu-tile-mobile-mic" :aria-label="t(tile.micOn ? 'Education.MicOn' : 'Education.MicOff')">
              <IconMic v-if="tile.micOn" :size="12" />
              <IconMicOff v-else :size="12" />
              <span
                v-if="isSpeaking"
                class="edu-tile-mobile-mic-core"
                :style="{ clipPath: `inset(${waveInset}% 0 0 0)` }"
              />
            </span>
            <span class="edu-tile-mobile-name">{{ tile.name }}</span>
            <em v-if="tile.seat === 'teacher'" class="edu-tile-mobile-tag">{{ t('Education.Teacher') }}</em>
          </div>
        </div>
      </template>
    </RoomParticipantView>

    <div v-else class="edu-tile-mobile-wait">
      <img class="edu-tile-mobile-wait-figure" :src="tile.seat === 'teacher' ? waitTeacher : waitStudent" alt="" draggable="false">
      <span class="edu-tile-mobile-wait-label">
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
import { IconMic, IconMicOff, IconNet, IconTrophyUi, TUIAvatar, t, useUIConfig } from '../../base';
import type { TileData } from './classroomData';
import waitStudent from './assets/wait-student.svg';
import waitTeacher from './assets/wait-teacher.svg';

const props = defineProps<{
  tile: TileData;
}>();

const { uiConfig } = useUIConfig();
const customUI = computed(() => uiConfig.participantViewUI);

const { speakingUsers } = useRoomParticipantState();

/** Conversation sits far below the reported ceiling of 100, so the bar tops out here. */
const SPEECH_PEAK = 40;
const WAVE_MIN_SCALE = 0.3;
const WAVE_MAX_SCALE = 1;

const volume = computed(() => {
  const userId = props.tile.participant?.userId;
  return userId ? speakingUsers.value.get(userId) ?? 0 : 0;
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
.edu-tile-mobile {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--rk-bg-camera-off);
  border-radius: 8px;
  container-type: inline-size;
}

.edu-tile-mobile.is-authorized::after {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
  content: '';
  border: 1px solid var(--rk-brand);
  border-radius: inherit;
}

.edu-tile-mobile-view {
  width: 100%;
  height: 100%;
}

.edu-tile-mobile-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* The stage face reads the neutral classroom pair (views-edu .video__face),
   not the base avatar's solid accent. */
.edu-tile-mobile-face {
  position: absolute;
  top: 44%;
  left: 50%;
  z-index: 1;
  display: flex;
  transform: translate(-50%, -50%);
}
.edu-tile-mobile-net {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 6;
  display: inline-flex;
  color: var(--rk-danger);
}

.edu-tile-mobile-trophy {
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

.edu-tile-mobile-trophy b {
  font-weight: 500;
}

.edu-tile-mobile-meta {
  position: absolute;
  bottom: 5px;
  left: 5px;
  z-index: 2;
  display: flex;
  gap: 3px;
  align-items: center;
  max-width: calc(100% - 10px);
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
}

.edu-tile-mobile-mic {
  position: relative;
  display: inline-flex;
  flex: none;
  width: 12px;
  height: 12px;
}

.edu-tile-mobile-mic :deep(svg) {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

/* Box is in IconMic's 16-unit viewBox: the capsule's outer edge inset by a quarter
   stroke, so the stroke hides the fill's edge. Update it if the icon path changes.
   The level is clipped from the top, since scaling would flatten the round bottom. */
.edu-tile-mobile-mic-core {
  position: absolute;
  top: calc(1.25 / 16 * 100%);
  left: calc(4.75 / 16 * 100%);
  z-index: 0;
  width: calc(6.5 / 16 * 100%);
  height: calc(10 / 16 * 100%);
  background: var(--rk-success);
  border-radius: 999px;
  transition: clip-path 0.2s ease-out;
}

.edu-tile-mobile-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edu-tile-mobile-tag {
  flex: none;
  padding: 0 4px;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  line-height: 14px;
  color: var(--rk-brand);
  background: color-mix(in srgb, var(--rk-brand) 18%, transparent);
  border-radius: 4px;
}

/* The tile is a fixed 4:3, so the design's height-based sizes are written in cqw (1cqh = 0.75cqw). */
.edu-tile-mobile-wait {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 8px;
  overflow: hidden;
}

.edu-tile-mobile-wait-figure {
  display: block;
  width: auto;
  max-width: 88%;
  height: clamp(32px, 36cqw, 58px);
  object-fit: contain;
}

.edu-tile-mobile-wait-label {
  max-width: 100%;
  overflow: hidden;
  font-size: clamp(10px, 7cqw, 12px);
  font-weight: 500;
  color: var(--rk-text-secondary);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@container (min-width: 160px) {
  .edu-tile-mobile-wait {
    gap: 8px;
  }

  .edu-tile-mobile-wait-figure {
    height: clamp(64px, 34.5cqw, 108px);
  }
}
</style>
