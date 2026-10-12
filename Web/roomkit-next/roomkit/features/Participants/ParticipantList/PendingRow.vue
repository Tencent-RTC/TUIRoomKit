<template>
  <div class="pending-row">
    <TUIAvatar
      class="pending-row-avatar"
      :src="participant.avatarUrl"
      :alt="displayName"
      :size="32"
    />
    <div class="pending-row-info">
      <span class="pending-row-name">{{ displayName }}</span>
    </div>
    <div class="pending-row-actions">
      <span v-if="showRejected" class="pending-row-state is-failed">
        {{ t('Participants.NoAnswer') }}
      </span>
      <span
        v-else-if="isCalling"
        class="pending-row-state is-calling"
      >
        <IconPhone :size="14" />
        <span>{{ t('Participants.Calling') }}</span>
      </span>
      <button
        v-else
        class="pending-row-state is-idle"
        type="button"
        :title="callLabel"
        :aria-label="callLabel"
        @click="call"
      >
        <IconPhone :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RoomParticipantStatus } from 'tuikit-atomicx-vue3/room';
import { IconPhone, TUIAvatar, TUIToast } from '../../../base';
import { t } from '../../../i18n';
import { participantDisplayName } from './useParticipant';
import { useInvitation } from './useInvitation';
import type { InvitationFailure } from './useInvitation';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const props = defineProps<{
  participant: RoomParticipant;
}>();

const { inviteUsers, recentCallFailures } = useInvitation();
const showRejected = computed(() => recentCallFailures.value.has(props.participant.userId));

const displayName = computed(() => participantDisplayName(props.participant));
const isCalling = computed(() => props.participant.roomStatus === RoomParticipantStatus.InCalling);
const callLabel = computed(() => t('Participants.Call'));

function notify(failure?: InvitationFailure) {
  if (!failure) {
    return false;
  }
  TUIToast[failure === 'failed' ? 'error' : 'warning'](t(`Participants.InviteFailure.${failure}`));
  return true;
}

async function call() {
  if (notify(await inviteUsers([props.participant.userId]))) {
    return;
  }
  TUIToast.success(t('Participants.CallStarted', { name: displayName.value }));
}
</script>

<style scoped lang="scss">
.pending-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  transition: background 0.12s ease;
}

.pending-row:hover {
  background: var(--rk-bg-muted);
}

.pending-row-avatar {
  flex: none;
}

.pending-row-info {
  min-width: 0;
  flex: 1;
}

.pending-row-name {
  display: block;
  overflow: hidden;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
}

.pending-row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 36px;
  flex: none;
}

.pending-row-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 28px;
  height: 28px;
  min-width: 28px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: var(--rk-success);
  color: var(--rk-on-accent);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.08s ease, filter 0.15s ease;
}

.pending-row-state :deep(.rk-icon) {
  display: block;
  width: 14px;
  height: 14px;
  flex: none;
}

.pending-row-state.is-idle:hover {
  background: var(--rk-success);
  filter: brightness(1.08);
}

.pending-row-state.is-idle:active {
  transform: scale(0.96);
}

.pending-row-state.is-calling {
  width: auto;
  min-width: 0;
  height: 28px;
  padding: 0 2px 0 0;
  gap: 6px;
  border-radius: 0;
  background: transparent;
  color: var(--rk-success);
  font-weight: 500;
  cursor: default;
  pointer-events: none;
  filter: none;
}

.pending-row-state.is-calling :deep(.rk-icon) {
  animation: pending-row-pulse 1.5s ease-in-out infinite;
}

.pending-row-state.is-failed {
  width: auto;
  max-width: 120px;
  min-width: 0;
  height: auto;
  padding: 0 2px;
  border-radius: 0;
  background: transparent;
  color: var(--rk-text-tertiary);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.25;
  text-align: right;
  white-space: normal;
  cursor: default;
  pointer-events: none;
  filter: none;
}

@keyframes pending-row-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.45;
    transform: scale(0.85);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pending-row-state.is-calling :deep(.rk-icon) {
    animation: none;
  }
}
</style>
