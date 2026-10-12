<template>
  <TUIDropdown
    placement="top"
    @command="handleCommand"
    @update:open="onOpen"
  >
    <ToolbarButton
      :label="t('Room.More')"
      :icon="IconMore"
      :active="open"
      aria-haspopup="menu"
      :aria-expanded="open"
    />

    <template #menu>
      <TUIDropdownItem
        v-for="item in menuItems"
        :key="item.id"
        :command="item.id"
        :class="{
          'overflow-menu-item-active': item.active,
          'overflow-menu-item-danger': item.danger,
        }"
      >
        <span class="overflow-menu-icon">
          <component
            :is="item.icon"
            v-if="item.icon"
            :size="16"
          />
        </span>
        {{ item.label }}
      </TUIDropdownItem>

      <TUIDropdownSeparator v-if="menuItems.length" />

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
  </TUIDropdown>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Component } from 'vue';
import { RecordingStatus, useRoomState } from 'tuikit-atomicx-vue3/room';
import {
  TUIDropdown,
  TUIDropdownItem,
  TUIDropdownSeparator,
} from '../../base/components/Dropdown';
import {
  IconChat,
  IconMaximize,
  IconMembers,
  IconMore,
  IconPip,
  IconRecord,
  IconRecording,
  IconSettings,
  IconShare,
  IconShareStop,
} from '../../base';
import { t } from '../../i18n';
import { useScreenShare } from '../../features/ScreenShare/ScreenShareButton/useScreenShare';
import ToolbarButton from '../ToolbarButton.vue';
import type { OverflowMenuEntry } from './useToolbarOverflow';

// Namespaced so shell entries never collide with a toolbar action id
const SHELL_COMMANDS = {
  minimize: 'shell:minimize',
  fullscreen: 'shell:fullscreen',
} as const;

const props = defineProps<{
  actions: OverflowMenuEntry[];
  fullscreen: boolean;
  minimizable?: boolean;
}>();

const emit = defineEmits<{
  action: [id: string];
  minimize: [];
  fullscreen: [];
  open: [];
}>();

const open = ref(false);
const { isLocalSharing } = useScreenShare();
const { currentRoom } = useRoomState();
const isRecording = computed(
  () => currentRoom.value?.recordingInfo?.status === RecordingStatus.Recording,
);

const menuItems = computed(() => props.actions.map(resolveItem));

function matches(label: string, ...keys: string[]) {
  return keys.some(key => t(key) === label);
}

interface OverflowMenuItem {
  id: string;
  label: string;
  icon?: Component;
  danger?: boolean;
  active?: boolean;
}

function resolveItem(action: OverflowMenuEntry): OverflowMenuItem {
  if (matches(action.label, 'ScreenShare.Share', 'ScreenShare.Stop')) {
    return {
      ...action,
      label: t(isLocalSharing.value ? 'ScreenShare.Stop' : 'ScreenShare.Share'),
      icon: isLocalSharing.value ? IconShareStop : IconShare,
      active: isLocalSharing.value,
    };
  }
  if (matches(action.label, 'CloudRecording.RecordLabel', 'CloudRecording.RecordingLabel')) {
    return {
      ...action,
      label: t(isRecording.value ? 'CloudRecording.RecordingLabel' : 'CloudRecording.RecordLabel'),
      icon: isRecording.value ? IconRecording : IconRecord,
      active: isRecording.value,
      danger: isRecording.value,
    };
  }
  return {
    ...action,
    icon: iconFor(action.label),
  };
}

function iconFor(label: string): Component | undefined {
  const icons: Array<[string, Component]> = [
    [t('Participants.Panel'), IconMembers],
    [t('Chat.Title'), IconChat],
    [t('Settings.Title'), IconSettings],
  ];
  return icons.find(([text]) => text === label)?.[1];
}

function onOpen(next: boolean) {
  open.value = next;
  if (next) {
    emit('open');
  }
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

  emit('action', id);
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

:deep(.overflow-menu-item-active) {
  background: color-mix(in srgb, var(--rk-info) 14%, transparent);
  color: var(--rk-info);
}

:deep(.overflow-menu-item-danger) {
  background: color-mix(in srgb, var(--rk-danger) 14%, transparent);
  color: var(--rk-danger);
}
</style>
