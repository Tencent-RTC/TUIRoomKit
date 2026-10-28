<template>
  <div
    class="participant-view-overlay"
    :class="{ 'is-speaking': isSpeaking }"
  >
    <!-- Camera-off: light tile fill + centered avatar only (design screenshot) -->
    <div
      v-if="showCameraOffMask"
      class="participant-view-overlay-mask"
      aria-hidden="true"
    >
      <div
        v-if="avatarUrl"
        class="participant-view-overlay-avatar"
      >
        <img
          class="participant-view-overlay-avatar-img"
          :src="avatarUrl"
          alt=""
          draggable="false"
        >
      </div>
      <div
        v-else
        class="participant-view-overlay-avatar"
      >
        {{ initial }}
      </div>
    </div>

    <div v-if="isScreenStream" class="participant-view-overlay-share-badge">
      <IconShare :size="10" />
      <span>{{ t('RoomView.SharingScreen') }}</span>
    </div>

    <!-- Share tiles, screen or board alike, carry no participant actions; the sharer's camera tile does. -->
    <ParticipantMoreMenu
      v-if="!hideActions && !isScreenStream"
      v-slot="{ open }"
      :participant="participant"
      placement="bottom-end"
    >
      <div
        class="participant-view-overlay-more"
        :class="{ 'is-open': open }"
        :title="t('Participants.More')"
        :aria-label="t('Participants.More')"
        @dblclick.stop
      >
        <IconMore :size="14" />
      </div>
    </ParticipantMoreMenu>

    <div class="participant-view-overlay-footer">
      <div class="participant-view-overlay-pill">
        <span class="participant-view-overlay-mic" aria-hidden="true">
          <IconMic v-if="micOn" :size="16" />
          <IconMicOff v-else :size="16" />
          <!-- The bar is the sign of speech, not of an open mic: an idle one sitting in
               every tile reads as everyone talking at once. -->
          <span
            v-if="isSpeaking"
            class="participant-view-overlay-mic-core"
            :style="{ clipPath: `inset(${waveInset}% 0 0 0)` }"
          />
        </span>

        <span class="participant-view-overlay-name">{{ displayName }}</span>

        <span
          v-if="isSelf"
          class="participant-view-overlay-role participant-view-overlay-role-me"
        >{{ t('Participants.Me') }}</span>
        <span
          v-if="roleLabel"
          class="participant-view-overlay-role"
          :class="roleClass"
        >{{ roleLabel }}</span>
      </div>

      <span
        v-if="showNetworkBars"
        class="participant-view-overlay-network"
        aria-hidden="true"
      >
        <i /><i /><i />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  DeviceStatus,
  NetworkQuality,
  RoomParticipantRole,
  VideoStreamType,
  useLoginState,
  useRoomParticipantState,
} from 'tuikit-atomicx-vue3/room';
import { IconMic, IconMicOff, IconMore, IconShare, t } from '../../../base';
import ParticipantMoreMenu from '../../Participants/ParticipantListPC/ParticipantMoreMenu.vue';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const props = defineProps<{
  participant: RoomParticipant;
  streamType: VideoStreamType;
  /** Drop the more menu where the tile is too small to act on, like the mini window. */
  hideActions?: boolean;
}>();

const { speakingUsers, networkQualities } = useRoomParticipantState();
const { loginUserInfo } = useLoginState();

const displayName = computed(() =>
  props.participant.nameCard
  || props.participant.userName
  || props.participant.userId,
);

const initial = computed(() => {
  const name = displayName.value.trim();
  return name ? name.charAt(0).toUpperCase() : '?';
});

const avatarUrl = computed(() => props.participant.avatarUrl || '');

const isSelf = computed(() =>
  !!loginUserInfo.value?.userId
  && loginUserInfo.value.userId === props.participant.userId,
);

const micOn = computed(() =>
  props.participant.microphoneStatus === DeviceStatus.On,
);

const cameraOn = computed(() =>
  props.participant.cameraStatus === DeviceStatus.On,
);

const showCameraOffMask = computed(() =>
  props.streamType === VideoStreamType.Camera && !cameraOn.value,
);

const isScreenStream = computed(() =>
  props.streamType === VideoStreamType.Screen,
);

const volume = computed(() =>
  speakingUsers.value.get(props.participant.userId) ?? 0,
);

/** Conversation sits far below the reported ceiling of 100, so the bar tops out here. */
const SPEECH_PEAK = 40;
const WAVE_MIN_SCALE = 0.3;
const WAVE_MAX_SCALE = 1;

/* A share tile carries the sharer's volume, but a halo around a desktop says nothing
   about the desktop — their camera tile is where their speaking reads.
   Engine reports 0 when silent, so any positive volume counts as speaking. */
const isSpeaking = computed(() =>
  !isScreenStream.value && micOn.value && volume.value > 0,
);

/** How much of the fill is cut away from the top; the rest reads as the level. */
const waveInset = computed(() => {
  const level = Math.min(volume.value / SPEECH_PEAK, 1);
  const scale = WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level;
  return ((1 - scale) * 100).toFixed(1);
});

const roleLabel = computed(() => {
  if (props.participant.role === RoomParticipantRole.Owner) {
    return t('Participants.Owner');
  }
  if (props.participant.role === RoomParticipantRole.Admin) {
    return t('Participants.Admin');
  }
  return '';
});

const roleClass = computed(() => {
  if (props.participant.role === RoomParticipantRole.Owner) {
    return 'participant-view-overlay-role-owner';
  }
  if (props.participant.role === RoomParticipantRole.Admin) {
    return 'participant-view-overlay-role-admin';
  }
  return '';
});

const networkQuality = computed(() =>
  networkQualities.value.get(props.participant.userId)?.quality
  ?? NetworkQuality.Unknown,
);

const showNetworkBars = computed(() =>
  networkQuality.value >= NetworkQuality.Poor,
);
</script>

<style scoped lang="scss">
/* The overlay fills its tile, so its own inline size is the tile's width. The design
   draws this chrome at two sizes — stage tile and strip thumbnail — so the tiers below
   are container queries instead of a prop each layout would have to pass down.
   Only the more chip takes the pointer, so whatever the tile hosts underneath (a board,
   an annotation) gets every other press; the chip is revealed by the tile's hover
   instead of the overlay's own. */
.participant-view-overlay {
  container: participant-tile / inline-size;
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: visible;
  pointer-events: none;
  user-select: none;
  border-radius: inherit;
  transition: box-shadow 0.25s ease-out;
}

/* Speaking: a 2px ring on the edge, a tight glow, and a faint wide one. The wide glow
   stays at 16px and faint so two neighbours speaking at once don't merge into one
   block. The glow paints past the tile, so every box above it must leave it unclipped. */
.participant-view-overlay.is-speaking {
  box-shadow:
    0 0 6px color-mix(in srgb, var(--rk-success) 45%, transparent),
    0 0 16px color-mix(in srgb, var(--rk-success) 20%, transparent);
  transition-duration: 0.15s;
}

.rk-root[data-rk-theme='dark'] .participant-view-overlay.is-speaking {
  box-shadow:
    0 0 6px color-mix(in srgb, var(--rk-success) 35%, transparent),
    0 0 16px color-mix(in srgb, var(--rk-success) 14%, transparent);
}

.participant-view-overlay::after {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  content: '';
  border-radius: inherit;
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--rk-success) 85%, transparent);
  opacity: 0;
  transition: opacity 0.25s ease-out;
}

.participant-view-overlay.is-speaking::after {
  opacity: 1;
  transition-duration: 0.15s;
}

@media (prefers-reduced-motion: reduce) {
  .participant-view-overlay,
  .participant-view-overlay::after {
    transition: none;
  }
}

/* Camera-off mask — matches design tile: soft gray fill + centered avatar */
.participant-view-overlay-mask {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: color-mix(in srgb, var(--rk-brand) 1.6%, #f8f7f9);
  border-radius: inherit;
}

.rk-root[data-rk-theme='dark'] .participant-view-overlay-mask {
  background: color-mix(in srgb, var(--rk-brand) 2%, #141414);
}

.participant-view-overlay-avatar {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  font-size: var(--rk-fs-2xl);
  font-weight: 600;
  line-height: 1;
  color: var(--rk-avatar-fg);
  letter-spacing: 0;
  background: var(--rk-avatar-bg);
  border-radius: 50%;
}

.participant-view-overlay-avatar-img {
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
  object-fit: cover;
}

/* Matches design .pip-badge on the floating window, not the large share-stage chip. */
.participant-view-overlay-share-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 3;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  max-width: calc(100% - 16px);
  padding: 4px 9px;
  font-size: var(--rk-fs-xs);
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  pointer-events: none;
  background: rgba(77, 124, 255, 0.92);
  backdrop-filter: blur(4px);
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(77, 124, 255, 0.35);
}

.participant-view-overlay-share-badge span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.participant-view-overlay-share-badge :deep(.rk-icon) {
  flex: none;
}

.participant-view-overlay :deep(.rk-dropdown-anchor) {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 4;
}

.participant-view-overlay-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #fff;
  pointer-events: auto;
  cursor: pointer;
  background: rgba(112, 112, 116, 0.62);
  backdrop-filter: blur(12px);
  border-radius: 10px;
  opacity: 0;
  transition: background 0.15s ease, opacity 0.2s ease, transform 0.2s ease;
  transform: translateY(-4px);
}

:global(:hover > .participant-view-overlay .participant-view-overlay-more),
.participant-view-overlay-more.is-open {
  opacity: 1;
  transform: translateY(0);
}

.participant-view-overlay-more:hover {
  background: rgba(132, 132, 136, 0.78);
  transform: translateY(0) scale(1.06);
}

.participant-view-overlay-more :deep(.rk-icon) {
  width: 14px;
  height: 14px;
}

.participant-view-overlay-footer {
  position: absolute;
  bottom: 9px;
  left: 9px;
  z-index: 2;
  display: flex;
  gap: 5px;
  align-items: center;
  width: max-content;
  min-width: 0;
  max-width: calc(100% - 18px);
  overflow: visible;
}

.participant-view-overlay-pill {
  display: inline-flex;
  flex: 1 1 auto;
  gap: 5px;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  min-height: 28px;
  padding: 4px 10px;
  overflow: hidden;
  color: #fff;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 14px;
}

.participant-view-overlay-mic {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: #fff;
}

/* Box is in IconMic's 16-unit viewBox: the capsule's outer edge inset by a quarter
   stroke, so the stroke hides the fill's edge. Update it if the icon path changes.
   The level is clipped from the top, since scaling would flatten the round bottom. */
.participant-view-overlay-mic-core {
  position: absolute;
  top: calc(1.25 / 16 * 100%);
  left: calc(4.75 / 16 * 100%);
  z-index: 0;
  width: calc(6.5 / 16 * 100%);
  height: calc(10 / 16 * 100%);
  background: #34c759;
  border-radius: 999px;
  transition: clip-path 0.2s ease-out;
}

/* The icon follows the mic slot so one tier switch resizes both */
.participant-view-overlay-mic :deep(svg) {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.participant-view-overlay-name {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 160px;
  overflow: hidden;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  line-height: 1.3;
  color: #fff;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-view-overlay-role {
  box-sizing: border-box;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  height: 16px;
  padding: 0 6px;
  overflow: hidden;
  font-size: var(--rk-fs-xs);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  border-radius: 999px;
}

.participant-view-overlay-role-me {
  color: var(--rk-text-secondary);
  background: color-mix(in srgb, var(--rk-text-primary) 10%, var(--rk-bg-surface));
}

.participant-view-overlay-role-owner {
  color: color-mix(in srgb, var(--rk-brand) 78%, #000);
  background: color-mix(in srgb, var(--rk-brand) 20%, var(--rk-bg-surface));
}

.participant-view-overlay-role-admin {
  color: color-mix(in srgb, var(--rk-warning) 58%, #000);
  background: color-mix(in srgb, var(--rk-warning) 20%, var(--rk-bg-surface));
}

.rk-root[data-rk-theme='dark'] .participant-view-overlay-role-owner {
  color: color-mix(in srgb, var(--rk-brand) 70%, #fff);
}

.rk-root[data-rk-theme='dark'] .participant-view-overlay-role-admin {
  color: var(--rk-warning);
}

.participant-view-overlay-network {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 2px;
  align-items: flex-end;
  height: 12px;
  color: #ff453a;
}

.participant-view-overlay-network i {
  display: block;
  width: 3px;
  background: currentcolor;
  border-radius: 1px;
}

.participant-view-overlay-network i:nth-child(1) {
  height: 4px;
}

.participant-view-overlay-network i:nth-child(2) {
  height: 8px;
  opacity: 0.28;
}

.participant-view-overlay-network i:nth-child(3) {
  height: 12px;
  opacity: 0.28;
}

/* Thumbnail tier: the strip and the filmstrip. Same chrome, one step smaller. */
@container participant-tile (max-width: 320px) {
  .participant-view-overlay-footer {
    bottom: 6px;
    left: 6px;
    gap: 4px;
    max-width: calc(100% - 12px);
  }

  .participant-view-overlay-pill {
    gap: 4px;
    min-height: 20px;
    padding: 3px 10px 3px 6px;
    border-radius: 10px;
  }

  .participant-view-overlay-mic {
    width: 14px;
    height: 14px;
  }

  .participant-view-overlay-name {
    max-width: 80px;
    font-size: var(--rk-fs-sm);
  }

  .participant-view-overlay-avatar {
    width: 48px;
    height: 48px;
    font-size: var(--rk-fs-xl);
  }

  .participant-view-overlay :deep(.rk-dropdown-anchor) {
    top: 8px;
    right: 8px;
  }

  .participant-view-overlay-more {
    width: 24px;
    height: 24px;
    border-radius: 8px;
  }

  .participant-view-overlay-more :deep(.rk-icon) {
    width: 12px;
    height: 12px;
  }
}
</style>
