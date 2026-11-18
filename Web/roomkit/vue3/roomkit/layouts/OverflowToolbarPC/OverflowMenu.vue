<template>
  <TUIDropdown
    :open="open"
    placement="top"
    @command="handleCommand"
    @update:open="onOpen"
  >
    <ToolbarButtonPC
      :label="t('Room.More')"
      :icon="IconMore"
      :active="open"
      aria-haspopup="menu"
      :aria-expanded="open"
    />

    <template #menu>
      <OverflowSubmenuPanel
        v-if="submenu"
        :submenu="submenu"
        @back="drilledId = null"
        @close="onOpen(false)"
      />

      <template v-else>
        <template v-for="entry in entries" :key="entry.id">
          <button
            v-if="'submenu' in entry.behavior"
            class="overflow-menu-entry"
            type="button"
            :disabled="entry.disabled"
            @click="drilledId = entry.id"
          >
            <span class="overflow-menu-icon">
              <component :is="entry.icon" v-if="entry.icon" :size="16" />
            </span>
            <span class="overflow-menu-label">{{ entry.label }}</span>
            <IconChevron class="overflow-menu-chevron" :size="12" />
          </button>
          <TUIDropdownItem
            v-else
            :command="entry.id"
            :disabled="entry.disabled"
          >
            <span class="overflow-menu-icon">
              <component :is="entry.icon" v-if="entry.icon" :size="16" />
            </span>
            {{ entry.label }}
          </TUIDropdownItem>
        </template>

        <TUIDropdownSeparator v-if="entries.length" />

        <TUIDropdownItem v-if="minimizable" :command="SHELL_COMMANDS.minimize">
          <span class="overflow-menu-icon">
            <IconPip :size="16" />
          </span>
          {{ t('Room.Pip') }}
        </TUIDropdownItem>
        <TUIDropdownItem :command="SHELL_COMMANDS.fullscreen">
          <span class="overflow-menu-icon">
            <IconMaximize :size="16" />
          </span>
          {{ fullscreen ? t('Room.ExitFullscreen') : t('Room.Fullscreen') }}
        </TUIDropdownItem>
      </template>
    </template>
  </TUIDropdown>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import {
  TUIDropdown,
  TUIDropdownItem,
  TUIDropdownSeparator,
  IconChevron,
  IconMaximize,
  IconMore,
  IconPip,
  t,
} from '../../base';
import ToolbarButtonPC from '../ToolbarButtonPC/ToolbarButtonPC.vue';
import OverflowSubmenuPanel from './OverflowSubmenuPanel.vue';
import { OVERFLOW_ITEM_KEY } from './overflowItem';
import type { OverflowMenuEntry } from './overflowItem';

// Namespaced so shell entries never collide with a toolbar entry id
const SHELL_COMMANDS = {
  minimize: 'shell:minimize',
  fullscreen: 'shell:fullscreen',
} as const;

const props = defineProps<{
  entries: OverflowMenuEntry[];
  fullscreen: boolean;
  minimizable?: boolean;
}>();

const emit = defineEmits<{
  minimize: [];
  fullscreen: [];
}>();

// The More button is the menu itself, not an item that can collapse into it.
provide(OVERFLOW_ITEM_KEY, null);

const open = ref(false);
const drilledId = ref<string | null>(null);

/** Read live, so a control that stops offering its submenu (a share starts) drops the drill. */
const submenu = computed(() => {
  const behavior = props.entries.find(entry => entry.id === drilledId.value)?.behavior;
  return behavior && 'submenu' in behavior ? behavior.submenu : null;
});

function onOpen(next: boolean) {
  open.value = next;
  drilledId.value = null;
}

function handleCommand(command: string | number) {
  const id = String(command);

  if (id === SHELL_COMMANDS.minimize) {
    emit('minimize');
    return;
  }
  if (id === SHELL_COMMANDS.fullscreen) {
    emit('fullscreen');
    return;
  }

  const behavior = props.entries.find(entry => entry.id === id)?.behavior;
  if (behavior && 'select' in behavior) {
    void behavior.select();
  }
}
</script>

<style scoped lang="scss">
.overflow-menu-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: var(--rk-space-2);
}

.overflow-menu-icon :deep(.rk-icon),
.overflow-menu-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.overflow-menu-entry {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 32px;
  padding: 0 12px;
  font: inherit;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-primary);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.overflow-menu-entry:hover {
  background: var(--rk-option-hover);
}

.overflow-menu-label {
  min-width: 0;
}

.overflow-menu-chevron {
  flex: none;
  margin-left: auto;
  color: var(--rk-text-tertiary);
  transform: rotate(-90deg);
}
</style>
