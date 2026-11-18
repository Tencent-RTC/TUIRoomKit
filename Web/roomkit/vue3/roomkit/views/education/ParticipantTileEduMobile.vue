<template>
  <div
    class="edu-tile-mobile"
    :class="{
      'is-waiting': !tile.participant,
      'is-speaking': isSpeaking,
      'is-teacher': tile.seat === 'teacher',
    }"
    :data-tile-role="tileRole"
  >
    <RoomParticipantView
      v-if="tile.participant"
      class="edu-tile-mobile-view"
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
        <div v-else class="edu-tile-mobile-overlay">
          <div v-if="!tile.cameraOn" class="edu-tile-mobile-mask">
            <div class="edu-tile-mobile-face">
              <TUIAvatar :src="tile.avatarUrl" :alt="tile.name" :size="faceSize" />
            </div>
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
              <svg
                v-if="isSpeaking"
                class="edu-tile-mobile-mic-core"
                viewBox="0 0 16 16"
                aria-hidden="true"
                :style="{ clipPath: `inset(${waveInset}% 0 0 0)` }"
              >
                <rect x="5.5" y="2" width="5" height="8.5" rx="2.5" />
              </svg>
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
  /** `stage` fills the main area and letterboxes; `thumb` is the 4:3 rail seat. */
  tileRole: 'stage' | 'thumb';
}>();

const faceSize = computed(() => (props.tileRole === 'stage' ? 72 : 36));

const { uiConfig } = useUIConfig();
const customUI = computed(() => uiConfig.participantViewUI);

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

/**
 * Top inset of the whole icon. The fill is a viewBox rect of the capsule
 * (y 2, height 8.5), so the cut is measured on the icon, not on the rect.
 */
const waveInset = computed(() => {
  const level = Math.min(volume.value / SPEECH_PEAK, 1);
  const scale = WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level;
  const capsuleTop = 12.5;
  const capsuleHeight = 53.125;
  return (capsuleTop + (1 - scale) * capsuleHeight).toFixed(1);
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

.edu-tile-mobile-view {
  width: 100%;
  height: 100%;
}

.edu-tile-mobile-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

/* Same frame as the avatar: covers the player, which paints its own black a frame later. */
.edu-tile-mobile-mask {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: var(--rk-bg-camera-off);
  border-radius: inherit;
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

.edu-tile-mobile-mic :deep(.rk-icon) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.edu-tile-mobile-mic :deep(.rk-icon svg) {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

/* Same viewBox as IconMic, so the rect is the capsule hole (x 5.5-10.5, y 2-10.5)
   and cannot drift off the outline at a 12px slot.
   Clipped from the top of the icon; scaling the rect would flatten its round bottom. */
.edu-tile-mobile-mic-core {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  transition: clip-path 0.2s ease-out;
}

.edu-tile-mobile-mic-core rect {
  fill: var(--rk-success);
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
