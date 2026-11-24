<template>
  <TUIDropdown placement="bottom-end" @command="onCommand">
    <button type="button" class="preclass-more" :aria-label="t('Preclass.More')">
      <IconMore :size="16" />
    </button>
    <template #menu>
      <TUIDropdownItem class="preclass-more-item" command="detail">
        {{ t('Preclass.ViewDetail') }}
      </TUIDropdownItem>
      <template v-if="!live">
        <TUIDropdownItem class="preclass-more-item" command="edit">
          {{ t('Preclass.EditClass') }}
        </TUIDropdownItem>
        <TUIDropdownItem class="preclass-more-item" command="cancel" danger>
          {{ t('Preclass.CancelClass') }}
        </TUIDropdownItem>
      </template>
    </template>
  </TUIDropdown>
</template>

<script setup lang="ts">
import { IconMore, TUIDropdown, TUIDropdownItem, t } from '@tencentcloud/roomkit-web-vue3';
import type { CourseMoreCommand } from './useClassSchedule';

defineProps<{
  /** A class in progress can no longer be edited or cancelled. */
  live: boolean;
}>();

const emit = defineEmits<{
  command: [command: CourseMoreCommand];
}>();

function onCommand(command: string | number) {
  emit('command', command as CourseMoreCommand);
}
</script>

<style scoped lang="scss">
.preclass-more {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.preclass-more:hover {
  color: var(--rk-brand);
  background: var(--rk-bg-hover);
}

/* The menu panel is teleported out of this component, so it is matched by its items. */
:global(.rk-float.rk-dropdown:has(.preclass-more-item)) {
  width: 128px;
  min-width: 128px;
  padding: 4px;
  border: 1px solid color-mix(in srgb, var(--rk-text-primary) 8%, transparent);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28), 0 1px 2px rgba(0, 0, 0, 0.16);
}

:global(.rk-float.rk-dropdown:has(.preclass-more-item) .rk-dropdown-body) {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rk-dropdown-item.preclass-more-item {
  height: 32px;
  padding: 0 10px;
  border-radius: 4px;
}

.rk-dropdown-item.preclass-more-item:hover,
.rk-dropdown-item.preclass-more-item[data-highlighted='true'] {
  background: color-mix(in srgb, var(--rk-text-primary) 8%, transparent);
}

.rk-dropdown-item.preclass-more-item[data-danger='true']:hover,
.rk-dropdown-item.preclass-more-item[data-danger='true'][data-highlighted='true'] {
  background: color-mix(in srgb, var(--rk-danger) 14%, transparent);
}
</style>
