<template>
  <div class="participant-list-mobile-row">
    <TUIAvatar :size="32" :src="row.avatarUrl" :alt="row.name" />
    <div class="participant-list-mobile-info">
      <div class="participant-list-mobile-name">
        <span class="participant-list-mobile-name-text">{{ row.name }}</span>
      </div>
    </div>
    <div class="participant-list-mobile-wait">
      <span v-if="row.callState === 'no-answer'" class="participant-list-mobile-wait-failed">
        {{ t('Participants.NoAnswer') }}
      </span>
      <span v-else-if="row.callState === 'calling'" class="participant-list-mobile-wait-call is-calling">
        <IconPhone class="participant-list-mobile-wait-pulse" :size="14" />
        <span>{{ t('Participants.Calling') }}</span>
      </span>
      <div
        v-else
        class="participant-list-mobile-wait-call"
        role="button"
        tabindex="0"
        :aria-label="t('Participants.Call')"
        @click="callOne(row.participant)"
      >
        <IconPhone :size="14" />
      </div>
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
