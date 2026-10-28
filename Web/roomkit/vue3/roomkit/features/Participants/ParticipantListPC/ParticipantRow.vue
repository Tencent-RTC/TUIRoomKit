<template>
  <div class="participant-row">
    <TUIAvatar
      class="participant-row-avatar"
      :src="row.avatarUrl"
      :alt="row.name"
      :size="32"
    />
    <div class="participant-row-info">
      <div class="participant-row-name">
        <span class="participant-row-name-text">{{ row.name }}</span>
        <span v-if="row.isSelf" class="participant-row-tag is-self">{{ t('Participants.Me') }}</span>
        <span v-if="row.roleTag === 'owner'" class="participant-row-tag is-owner">
          {{ t('Participants.Owner') }}
        </span>
        <span v-else-if="row.roleTag === 'admin'" class="participant-row-tag is-admin">
          {{ t('Participants.Admin') }}
        </span>
        <span v-if="row.isSharing" class="participant-row-tag is-sharing">
          <IconShare :size="10" />
          {{ t('Participants.Sharing') }}
        </span>
      </div>
    </div>
    <div class="participant-row-icons">
      <component
        :is="row.canOperateMedia ? 'button' : 'span'"
        class="participant-row-icon"
        :type="row.canOperateMedia ? 'button' : undefined"
        :title="row.micTooltip"
        @click="toggleMic(row.participant)"
      >
        <IconMic v-if="row.isMicOn" :size="14" />
        <IconMicOff v-else :size="14" />
      </component>
      <component
        :is="row.canOperateMedia ? 'button' : 'span'"
        class="participant-row-icon"
        :type="row.canOperateMedia ? 'button' : undefined"
        :title="row.camTooltip"
        @click="toggleCam(row.participant)"
      >
        <IconCam v-if="row.isCamOn" :size="14" />
        <IconCamOff v-else :size="14" />
      </component>
    </div>
    <ParticipantMoreMenu
      v-slot="{ open }"
      :participant="row.participant"
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
import {
  IconCam,
  IconCamOff,
  IconMic,
  IconMicOff,
  IconMore,
  IconShare,
  TUIAvatar,
  t,
} from '../../../base';
import { useParticipantActions } from '../participantActions';
import type { JoinedRowData } from '../participantData';
import ParticipantMoreMenu from './ParticipantMoreMenu.vue';

defineProps<{
  row: JoinedRowData;
}>();

const { toggleMic, toggleCam } = useParticipantActions();
</script>

<style scoped lang="scss" src="./ParticipantRow.scss"></style>
