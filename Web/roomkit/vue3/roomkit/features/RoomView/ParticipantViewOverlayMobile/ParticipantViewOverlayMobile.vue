<template>
  <div
    class="participant-view-overlay participant-view-overlay-mobile"
    :class="{ 'is-speaking': isSpeaking, 'is-pip': inPip }"
  >
    <div
      v-if="showCameraOffMask"
      class="participant-view-overlay-mask"
      aria-hidden="true"
    >
      <div class="participant-view-overlay-avatar">
        <img
          v-if="avatarUrl"
          class="participant-view-overlay-avatar-img"
          :src="avatarUrl"
          alt=""
          draggable="false"
        >
        <template v-else>
          {{ initial }}
        </template>
      </div>
    </div>

    <button
      v-if="showFlipCamera"
      class="participant-view-overlay-flip"
      type="button"
      :aria-label="t('Device.FlipCamera')"
      @click.stop="emit('flip-camera')"
      @pointerdown.stop
    >
      <IconFlipCamera :size="16" />
    </button>

    <span
      v-if="showNetworkBars"
      class="participant-view-overlay-network"
      aria-hidden="true"
    >
      <i /><i /><i />
    </span>

    <div class="participant-view-overlay-stack">
      <div class="participant-view-overlay-pill">
        <span class="participant-view-overlay-mic" aria-hidden="true">
          <IconMic v-if="micOn" :size="12" />
          <IconMicOff v-else :size="12" />
          <span
            v-if="isSpeaking"
            class="participant-view-overlay-mic-core"
            :style="{ transform: `scaleY(${waveScale})` }"
          />
        </span>

        <span
          v-if="roleLabel"
          class="participant-view-overlay-role-mark"
          :class="roleClass"
          role="img"
          :aria-label="roleLabel"
        >
          <IconHostRole v-if="isOwner" :size="12" />
          <IconRoleUser v-else :size="11" />
        </span>

        <span class="participant-view-overlay-name">{{ displayName }}</span>

        <span v-if="isSelf" class="participant-view-overlay-me">{{ t('Participants.Me') }}</span>
      </div>
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
import { IconFlipCamera, IconHostRole, IconMic, IconMicOff, IconRoleUser, t } from '../../../base';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const props = defineProps<{
  participant: RoomParticipant;
  streamType: VideoStreamType;
  /** The camera window on the share page: no signal bars, and a smaller flip. */
  inPip?: boolean;
}>();

/* The stage owns the flip: it outlives the tile, which paging remounts, so the front
   camera's mirror setting survives a page turn. */
const emit = defineEmits<{
  'flip-camera': [];
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

const micOn = computed(() => props.participant.microphoneStatus === DeviceStatus.On);
const cameraOn = computed(() => props.participant.cameraStatus === DeviceStatus.On);
const isScreenStream = computed(() => props.streamType === VideoStreamType.Screen);

const showCameraOffMask = computed(() => !isScreenStream.value && !cameraOn.value);

const showFlipCamera = computed(() =>
  isSelf.value && cameraOn.value && !isScreenStream.value,
);

const volume = computed(() => speakingUsers.value.get(props.participant.userId) ?? 0);

const SPEECH_PEAK = 40;
const WAVE_MIN_SCALE = 0.3;
const WAVE_MAX_SCALE = 1;

/* A share tile carries the sharer's volume; the halo belongs on their camera tile. */
const isSpeaking = computed(() => !isScreenStream.value && micOn.value && volume.value > 0);

const waveScale = computed(() => {
  const level = Math.min(volume.value / SPEECH_PEAK, 1);
  return (WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level).toFixed(2);
});

const isOwner = computed(() => props.participant.role === RoomParticipantRole.Owner);

const roleLabel = computed(() => {
  if (isOwner.value) {
    return t('Participants.Owner');
  }
  if (props.participant.role === RoomParticipantRole.Admin) {
    return t('Participants.Admin');
  }
  return '';
});

const roleClass = computed(() => (isOwner.value ? 'is-owner' : 'is-admin'));

const networkQuality = computed(() =>
  networkQualities.value.get(props.participant.userId)?.quality
  ?? NetworkQuality.Unknown,
);

const showNetworkBars = computed(() => !props.inPip && networkQuality.value >= NetworkQuality.Poor);
</script>

<style scoped lang="scss">
/* Phone tile chrome. There is no hover on a phone, so the tile carries no more menu:
   acting on a person happens in the participant list. */
.participant-view-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: visible;
  pointer-events: none;
  border-radius: inherit;
}

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
  width: 72px;
  height: 72px;
  overflow: hidden;
  font-size: 26px;
  font-weight: 600;
  line-height: 1;
  color: var(--rk-avatar-fg);
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

.participant-view-overlay-flip {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #fff;
  pointer-events: auto;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.45);
  border: 0;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
}

.participant-view-overlay-flip:active {
  transform: scale(0.96);
}

.participant-view-overlay-network {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  display: inline-flex;
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
  opacity: 0.18;
}

.participant-view-overlay-network i:nth-child(3) {
  height: 12px;
  opacity: 0.18;
}

.participant-view-overlay-stack {
  position: absolute;
  bottom: 6px;
  left: 6px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  max-width: calc(100% - 12px);
}

.participant-view-overlay-pill {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  padding: 2px 6px 2px 4px;
  overflow: hidden;
  color: #fff;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 999px;
}

.participant-view-overlay-mic {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  color: #fff;
}

.participant-view-overlay-mic-core {
  position: absolute;
  top: 12%;
  left: 34%;
  z-index: 0;
  width: 31%;
  height: 52%;
  background: #34c759;
  border-radius: 999px;
  transition: transform 0.2s ease-out;
  transform-origin: bottom center;
}

.participant-view-overlay-mic :deep(svg) {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.participant-view-overlay-name {
  flex: 0 1 auto;
  min-width: 1ch;
  overflow: hidden;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  line-height: 16px;
  color: #fff;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-view-overlay-role-mark {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  line-height: 0;
  color: #fff;
  border-radius: 50%;
}

.participant-view-overlay-role-mark.is-owner {
  background: var(--rk-brand);
}

.participant-view-overlay-role-mark.is-admin {
  background: var(--rk-warning);
}

.participant-view-overlay-me {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: var(--rk-fs-xs);
  font-weight: 500;
  line-height: 1;
  color: #fff;
  background: rgba(255, 255, 255, 0.24);
  border-radius: 50%;
}

.participant-view-overlay.is-pip .participant-view-overlay-flip {
  top: 6px;
  left: 6px;
  width: 24px;
  height: 24px;
}

.participant-view-overlay.is-pip .participant-view-overlay-flip :deep(svg) {
  width: 14px;
  height: 14px;
}

.participant-view-overlay.is-pip .participant-view-overlay-avatar {
  width: 48px;
  height: 48px;
  font-size: 18px;
}
</style>
