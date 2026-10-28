<template>
  <ToolbarButtonMobile
    :label="t('Participants.Panel')"
    :active="active"
    :pressed="active"
    @click="emit('click')"
  >
    <IconMembers :size="20" />
    <template #badge>
      <span class="participant-button-mobile-count" aria-hidden="true">{{ countLabel }}</span>
    </template>
  </ToolbarButtonMobile>
</template>

<script setup lang="ts">
import { IconMembers, t } from '../../../base';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile.vue';
import { useParticipantAutoLoad, useParticipantCount } from '../participantData';

withDefaults(defineProps<{ active?: boolean }>(), { active: false });
const emit = defineEmits<{ click: [] }>();

// The member sheet mounts only when opened, so this button, mounted for the whole meeting, starts the load.
useParticipantAutoLoad();
const { countLabel } = useParticipantCount();
</script>

<style scoped lang="scss" src="./ParticipantButtonMobile.scss"></style>
