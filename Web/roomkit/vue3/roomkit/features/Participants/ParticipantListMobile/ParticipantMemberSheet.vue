<template>
  <ParticipantActionSheet :open="open" :groups="menuGroups" @update:open="emit('update:open', $event)" @select="onSelect" />

  <TUIDialog
    :open="renameDialogOpen"
    :title="t('Participants.Rename')"
    :closable="false"
    :confirm-text="t('Participants.Confirm')"
    :cancel-text="t('Participants.Cancel')"
    :confirm-disabled="!newName.trim()"
    @update:open="renameDialogOpen = $event"
    @confirm="submitRename"
  >
    <p class="participant-list-mobile-rename-desc">
      {{ t('Participants.RenameDesc') }}
    </p>
    <TUIInput
      v-model="newName"
      :placeholder="t('Participants.RenamePlaceholder')"
      :maxlength="10"
      @enter="submitRename"
    />
  </TUIDialog>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue';
import { TUIDialog, TUIInput, t } from '../../../base';
import { useParticipantActions } from '../participantActions';
import { useJoinedParticipant, useParticipantMenu } from '../participantData';
import type { ParticipantCommand } from '../participantData';
import ParticipantActionSheet from './ParticipantActionSheet.vue';

const props = defineProps<{
  open: boolean;
  /** Outlives the sheet, so the rename dialog opened from it still knows whom it renames. */
  userId: string;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const renameDialogOpen = ref(false);
const newName = ref('');

const participant = useJoinedParticipant(toRef(props, 'userId'));
const { displayName, menuGroups } = useParticipantMenu(participant);
const { runCommand, rename } = useParticipantActions();

// The member can leave the room or lose its last action while the sheet is open.
watch(menuGroups, (groups) => {
  if (props.open && groups.length === 0) {
    emit('update:open', false);
  }
});

function onSelect(key: string) {
  emit('update:open', false);
  const target = participant.value;
  if (!target) {
    return;
  }
  const command = key as ParticipantCommand;
  if (command === 'rename') {
    newName.value = displayName.value;
    renameDialogOpen.value = true;
    return;
  }
  void runCommand(command, target);
}

async function submitRename() {
  if (participant.value && await rename(participant.value, newName.value)) {
    renameDialogOpen.value = false;
  }
}
</script>

<style scoped lang="scss" src="./ParticipantMemberSheet.scss"></style>
