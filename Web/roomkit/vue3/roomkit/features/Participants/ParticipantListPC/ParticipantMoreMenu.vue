<template>
  <TUIDropdown
    v-if="hasMenu"
    trigger="click"
    :placement="placement"
    @update:open="open = $event"
    @command="onCommand"
  >
    <slot :open="open" />
    <template #menu>
      <div class="participant-more-menu">
        <template v-for="item in menuItems" :key="item.command">
          <TUIDropdownSeparator v-if="item.separatorBefore" />
          <TUIDropdownItem :command="item.command" :danger="item.danger">
            <component :is="item.icon" :size="16" />
            {{ item.label }}
          </TUIDropdownItem>
        </template>
      </div>
    </template>
  </TUIDropdown>

  <TUIDialog
    :open="renameDialogOpen"
    :title="t('Participants.Rename')"
    :confirm-text="t('Participants.Confirm')"
    :cancel-text="t('Participants.Cancel')"
    :confirm-disabled="!newName.trim()"
    @update:open="renameDialogOpen = $event"
    @confirm="submitRename"
  >
    <div class="participant-rename">
      <p class="participant-rename-desc">
        {{ t('Participants.RenameDesc') }}
      </p>
      <TUIInput
        v-model="newName"
        :placeholder="t('Participants.RenamePlaceholder')"
        :maxlength="10"
        @enter="submitRename"
      />
    </div>
  </TUIDialog>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue';
import {
  TUIDialog,
  TUIDropdown,
  TUIDropdownItem,
  TUIDropdownSeparator,
  TUIInput,
  t,
} from '../../../base';
import type { Placement } from '../../../base';
import { useParticipantActions } from '../participantActions';
import { useParticipantMenu } from '../participantData';
import type { ParticipantCommand } from '../participantData';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const props = withDefaults(defineProps<{
  participant: RoomParticipant;
  placement?: Placement;
}>(), {
  placement: 'bottom-end',
});

const open = ref(false);
const renameDialogOpen = ref(false);
const newName = ref('');

const { displayName, hasMenu, menuItems } = useParticipantMenu(toRef(props, 'participant'));
const { runCommand, rename } = useParticipantActions();

function onCommand(command: string | number) {
  const next = command as ParticipantCommand;
  if (next === 'rename') {
    newName.value = displayName.value;
    renameDialogOpen.value = true;
    return;
  }
  void runCommand(next, props.participant);
}

async function submitRename() {
  if (await rename(props.participant, newName.value)) {
    renameDialogOpen.value = false;
  }
}
</script>

<style scoped lang="scss" src="./ParticipantMoreMenu.scss"></style>
