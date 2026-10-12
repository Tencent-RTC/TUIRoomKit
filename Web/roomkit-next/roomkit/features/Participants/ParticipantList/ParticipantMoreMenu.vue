<template>
  <TUIDropdown
    v-if="visible"
    trigger="click"
    :placement="placement"
    @update:open="open = $event"
    @command="onCommand"
  >
    <slot :open="open">
      <button
        class="participant-more-trigger"
        type="button"
        :class="{ 'is-open': open }"
        :title="t('Participants.More')"
        :aria-label="t('Participants.More')"
      >
        <IconMore :size="14" />
      </button>
    </slot>
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
    :open="renameOpen"
    :title="t('Participants.Rename')"
    :confirm-text="t('Participants.Confirm')"
    :cancel-text="t('Participants.Cancel')"
    :confirm-disabled="!renameValue.trim()"
    @update:open="onRenameOpen"
    @confirm="submitRename"
  >
    <div
      class="participant-rename"
    >
      <p class="participant-rename-desc">
        {{ t('Participants.RenameDesc') }}
      </p>
      <TUIInput
        v-model="renameValue"
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
  IconMore,

} from '../../../base';
import type { Placement } from '../../../base';
import { t } from '../../../i18n';
import { useParticipantMoreMenu } from './useParticipantMoreMenu';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const props = withDefaults(defineProps<{
  participant: RoomParticipant;
  placement?: Placement;
}>(), {
  placement: 'bottom-end',
});

const open = ref(false);
const renameOpen = ref(false);
const renameValue = ref('');

const {
  displayName,
  visible,
  menuItems,
  confirmRename,
  runCommand,
} = useParticipantMoreMenu(toRef(props, 'participant'));

async function onCommand(command: string | number) {
  if (command === 'rename') {
    renameValue.value = displayName.value;
    renameOpen.value = true;
    return;
  }
  await runCommand(command);
}

function onRenameOpen(next: boolean) {
  renameOpen.value = next;
  if (!next) {
    renameValue.value = '';
  }
}

async function submitRename() {
  if (!await confirmRename(renameValue.value)) {
    return;
  }
  renameOpen.value = false;
  renameValue.value = '';
}
</script>

<style scoped lang="scss">
.participant-more-trigger {
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
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, opacity 0.12s ease;
}

.participant-more-trigger:hover,
.participant-more-trigger.is-open {
  background: var(--rk-bg-muted);
  color: var(--rk-text-primary);
}

.participant-more-trigger :deep(.rk-icon) {
  width: 14px;
  height: 14px;
}

.participant-more-menu :deep(.rk-dropdown-item) {
  gap: 8px;
  font-size: 12.5px;
}

.participant-more-menu :deep(.rk-dropdown-item .rk-icon) {
  flex: none;
  color: var(--rk-text-secondary);
}

.participant-more-menu :deep(.rk-dropdown-item[data-danger='true'] .rk-icon) {
  color: var(--rk-danger);
}

.participant-rename-desc {
  margin: 0 0 16px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--rk-text-secondary);
}

.participant-rename :deep(.rk-input-field) {
  font-size: 14px;
  font-weight: 500;
}

.participant-rename :deep(.rk-input-field::placeholder) {
  font-weight: 400;
}
</style>
