<template>
  <div class="participant-row">
    <TUIAvatar
      class="participant-row-avatar"
      :src="participant.avatarUrl"
      :alt="displayName"
      :size="32"
    />
    <div class="participant-row-info">
      <div class="participant-row-name">
        <span class="participant-row-name-text">{{ displayName }}</span>
        <span v-if="isSelf" class="participant-row-tag is-self">{{ t('Participants.Me') }}</span>
        <span
          v-if="roleLabel"
          class="participant-row-tag"
          :class="roleClass"
        >{{ roleLabel }}</span>
        <span v-if="isSharing" class="participant-row-tag is-sharing">
          <IconShare :size="10" />
          {{ t('Participants.Sharing') }}
        </span>
      </div>
    </div>
    <div class="participant-row-icons">
      <component
        :is="canOperateMedia ? 'button' : 'span'"
        class="participant-row-icon"
        :type="canOperateMedia ? 'button' : undefined"
        :class="{ on: isMicOn, muted: !isMicOn }"
        :title="micTitle"
        @click="toggleMic"
      >
        <IconMic v-if="isMicOn" :size="14" />
        <IconMicOff v-else :size="14" />
      </component>
      <component
        :is="canOperateMedia ? 'button' : 'span'"
        class="participant-row-icon"
        :type="canOperateMedia ? 'button' : undefined"
        :class="{ on: isCamOn, muted: !isCamOn }"
        :title="camTitle"
        @click="toggleCam"
      >
        <IconCam v-if="isCamOn" :size="14" />
        <IconCamOff v-else :size="14" />
      </component>
    </div>
    <ParticipantMoreMenu
      v-slot="{ open }"
      :participant="participant"
    >
      <button
        class="participant-row-more"
        type="button"
        :class="{ 'is-open': open }"
        :title="t('Participants.More')"
        :aria-label="t('Participants.More')"
      >
        <IconMore :size="14" />
      </button>
    </ParticipantMoreMenu>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { DeviceStatus, RoomParticipantRole } from 'tuikit-atomicx-vue3/room';
import {
  IconCam,
  IconCamOff,
  IconMic,
  IconMicOff,
  IconMore,
  IconShare,
  TUIAvatar,
} from '../../../base';
import { t } from '../../../i18n';
import ParticipantMoreMenu from './ParticipantMoreMenu.vue';
import { useParticipantMoreMenu } from './useParticipantMoreMenu';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const props = defineProps<{
  participant: RoomParticipant;
}>();

const {
  isSelf,
  displayName,
  isMicOn,
  isCamOn,
  canOperateMedia,
  micTitle,
  camTitle,
  toggleMic,
  toggleCam,
} = useParticipantMoreMenu(toRef(props, 'participant'));

const isSharing = computed(() => props.participant.screenShareStatus === DeviceStatus.On);
const roleLabel = computed(() => {
  if (props.participant.role === RoomParticipantRole.Owner) {
    return t('Participants.Owner');
  }
  if (props.participant.role === RoomParticipantRole.Admin) {
    return t('Participants.Admin');
  }
  return '';
});
const roleClass = computed(() => (
  props.participant.role === RoomParticipantRole.Owner ? 'is-owner' : 'is-admin'
));
</script>

<style scoped lang="scss">
.participant-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  transition: background 0.12s ease;
}

.participant-row:hover {
  background: var(--rk-bg-muted);
}

.participant-row-avatar {
  flex: none;
}

.participant-row-info {
  min-width: 0;
  flex: 1;
}

.participant-row-name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
}

.participant-row-name-text {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Role chips share one shape. Soft fills mix into the surface.
   Light text is darkened; dark text is lifted so both themes stay readable. */
.participant-row-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 18px;
  flex: none;
  box-sizing: border-box;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--rk-brand) 20%, var(--rk-bg-surface));
  color: color-mix(in srgb, var(--rk-brand) 78%, #000);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.participant-row-tag.is-admin {
  background: color-mix(in srgb, var(--rk-warning) 20%, var(--rk-bg-surface));
  color: color-mix(in srgb, var(--rk-warning) 58%, #000);
}

.rk-root[data-rk-theme='dark'] .participant-row-tag.is-owner {
  color: color-mix(in srgb, var(--rk-brand) 70%, #fff);
}

.rk-root[data-rk-theme='dark'] .participant-row-tag.is-admin {
  color: var(--rk-warning);
}

.participant-row-tag.is-self {
  background: color-mix(in srgb, var(--rk-text-primary) 10%, var(--rk-bg-surface));
  color: var(--rk-text-secondary);
}

.participant-row-tag.is-sharing {
  gap: 3px;
  background: var(--rk-brand-soft);
  color: var(--rk-brand-hover);
}

.participant-row-tag.is-sharing :deep(.rk-icon) {
  width: 10px;
  height: 10px;
}

.participant-row-icons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.participant-row-icon,
.participant-row-more {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--rk-text-tertiary);
  transition: background 0.12s ease, color 0.12s ease, opacity 0.12s ease;
}

button.participant-row-icon,
.participant-row-more {
  cursor: pointer;
}

button.participant-row-icon:hover,
.participant-row-more:hover {
  background: var(--rk-bg-muted);
  color: var(--rk-text-primary);
}

/* The off icons carry their own red slash, so the glyph itself stays neutral. */
.participant-row-icon.on,
.participant-row-icon.muted {
  color: var(--rk-text-secondary);
}

.participant-row-icon :deep(.rk-icon),
.participant-row-more :deep(.rk-icon) {
  width: 14px;
  height: 14px;
}

/* Always present but faint; the row hover promotes it to full strength. */
.participant-row-more {
  opacity: 0.55;
}

.participant-row:hover .participant-row-more,
.participant-row-more.is-open {
  opacity: 1;
}
</style>
