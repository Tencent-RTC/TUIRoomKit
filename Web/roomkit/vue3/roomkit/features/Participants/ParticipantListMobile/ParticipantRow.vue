<template>
  <div
    class="participant-list-mobile-row"
    :class="{ 'is-tappable': row.hasMenu }"
    :role="row.hasMenu ? 'button' : undefined"
    :tabindex="row.hasMenu ? 0 : undefined"
    @click="row.hasMenu && emit('select', row.userId)"
  >
    <TUIAvatar :size="32" :src="row.avatarUrl" :alt="row.name" />
    <div class="participant-list-mobile-info">
      <div class="participant-list-mobile-name">
        <span class="participant-list-mobile-name-text">{{ row.name }}</span>
        <span v-if="row.isSelf" class="participant-list-mobile-tag is-self">{{ t('Participants.Me') }}</span>
        <span v-if="row.roleTag === 'owner'" class="participant-list-mobile-tag is-owner">
          {{ t('Participants.Owner') }}
        </span>
        <span v-else-if="row.roleTag === 'admin'" class="participant-list-mobile-tag is-admin">
          {{ t('Participants.Admin') }}
        </span>
        <span v-if="row.isSharing" class="participant-list-mobile-tag is-sharing">
          <IconShare :size="10" />
          {{ t('Participants.Sharing') }}
        </span>
      </div>
    </div>
    <div class="participant-list-mobile-icons">
      <span class="participant-list-mobile-status">
        <IconMic v-if="row.isMicOn" :size="14" />
        <IconMicOff v-else :size="14" />
      </span>
      <span class="participant-list-mobile-status">
        <IconCam v-if="row.isCamOn" :size="14" />
        <IconCamOff v-else :size="14" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconCam,
  IconCamOff,
  IconMic,
  IconMicOff,
  IconShare,
  TUIAvatar,
  t,
} from '../../../base';
import type { JoinedRowData } from '../participantData';

defineProps<{
  row: JoinedRowData;
}>();

const emit = defineEmits<{
  select: [userId: string];
}>();
</script>

<style scoped lang="scss" src="./ParticipantRow.scss"></style>
