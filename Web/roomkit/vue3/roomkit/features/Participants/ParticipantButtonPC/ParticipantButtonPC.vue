<template>
  <ToolbarButtonPC
    :label="label || t('Participants.Panel')"
    overflow-key="Participants.Panel"
    :active="active"
    @click="handleClick"
  >
    <template #icon>
      <IconMembers :size="22" />
      <span class="participant-button-badge">{{ count }}</span>
    </template>
  </ToolbarButtonPC>
</template>

<script setup lang="ts">
import { IconMembers, t } from '../../../base';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';
import { useParticipantAutoLoad, useParticipantCount } from '../participantData';

withDefaults(defineProps<{ active?: boolean }>(), { active: false });
const emit = defineEmits<{ click: [] }>();

const { refreshParticipants } = useParticipantAutoLoad();
const { count } = useParticipantCount();

/** The room watch can miss the first empty load if the engine is not ready yet. */
function handleClick() {
  void refreshParticipants();
  emit('click');
}
</script>

<style scoped lang="scss" src="./ParticipantButtonPC.scss"></style>
