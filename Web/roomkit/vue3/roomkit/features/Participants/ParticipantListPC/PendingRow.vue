<template>
  <div class="pending-row">
    <TUIAvatar class="pending-row-avatar" :src="row.avatarUrl" :alt="row.name" :size="32" />
    <span class="pending-row-name">{{ row.name }}</span>
    <div class="pending-row-actions">
      <span v-if="row.callState === 'no-answer'" class="pending-row-state is-failed">
        {{ t('Participants.NoAnswer') }}
      </span>
      <span v-else-if="row.callState === 'calling'" class="pending-row-state is-calling">
        <IconPhone :size="14" />
        <span>{{ t('Participants.Calling') }}</span>
      </span>
      <button
        v-else
        class="pending-row-state is-idle"
        type="button"
        :title="t('Participants.Call')"
        :aria-label="t('Participants.Call')"
        @click="callOne(row.participant)"
      >
        <IconPhone :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPhone, TUIAvatar, t } from '../../../base';
import { useParticipantCall } from '../participantActions';
import type { PendingRowData } from '../participantData';

defineProps<{
  row: PendingRowData;
}>();

const { callOne } = useParticipantCall();
</script>

<style scoped lang="scss" src="./PendingRow.scss"></style>
