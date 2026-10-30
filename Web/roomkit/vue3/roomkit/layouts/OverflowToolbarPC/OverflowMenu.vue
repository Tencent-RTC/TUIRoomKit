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
      <div v-if="submenu" class="overflow-menu-sub">
        <button
          ref="backRef"
          class="overflow-menu-back"
          type="button"
          @click="emit('leave')"
        >
          <IconChevron class="overflow-menu-back-icon" :size="12" />
          <span>{{ submenu.title }}</span>
        </button>
        <div class="overflow-menu-sub-split" />
        <div
          v-if="submenu.hint"
          class="overflow-menu-sub-hint"
          role="note"
        >
          <IconInfo :size="14" />
          <span>{{ submenu.hint }}</span>
        </div>
        <template v-for="(item, index) in submenu.items" :key="item.act ?? `split-${index}`">
          <div v-if="item.divider" class="overflow-menu-sub-split" />
          <button
            v-else
            class="overflow-menu-sub-item"
            :class="{ 'is-on': item.on }"
            type="button"
            :disabled="item.disabled"
            @click="runSubmenu(item.act)"
          >
            <component :is="item.icon" v-if="item.icon" :size="14" />
            <span>{{ item.label }}</span>
          </button>
        </template>
      </div>

      <template v-else>
        <template v-for="item in menuItems" :key="item.id">
          <button
            v-if="item.hasSubmenu"
            class="overflow-menu-entry"
            type="button"
            @click="emit('drill', item.id)"
          >
            <span class="overflow-menu-icon">
              <component :is="item.icon" v-if="item.icon" :size="16" />
            </span>
            <span class="overflow-menu-label">{{ item.label }}</span>
            <IconChevron class="overflow-menu-chevron" :size="12" />
          </button>
          <TUIDropdownItem
            v-else
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
        </template>

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
    </template>
  </TUIDropdown>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { Component } from 'vue';
import { RecordingStatus, useRoomState } from 'tuikit-atomicx-vue3/room';
import {
  TUIDropdown,
  TUIDropdownItem,
  TUIDropdownSeparator,
  IconAISubtitles,
  IconChat,
  IconChevron,
  IconInfo,
  IconMaximize,
  IconMembers,
  IconMore,
  IconPip,
  IconRecord,
  IconRecording,
  IconSettings,
  IconShare,
  IconShareStop,
  t,
} from '../../base';
import { useScreenShare } from '../../features/ScreenShare/ScreenShareButton/useScreenShare';
import ToolbarButtonPC from '../ToolbarButtonPC/ToolbarButtonPC.vue';
import type { OverflowSubmenu } from './overflowSubmenu';
import type { OverflowMenuEntry } from './useToolbarOverflow';

// Namespaced so shell entries never collide with a toolbar action id
const SHELL_COMMANDS = {
  minimize: 'shell:minimize',
  fullscreen: 'shell:fullscreen',
} as const;

const props = defineProps<{
  actions: OverflowMenuEntry[];
  submenu?: OverflowSubmenu | null;
  fullscreen: boolean;
  minimizable?: boolean;
}>();

const emit = defineEmits<{
  action: [id: string];
  drill: [id: string];
  leave: [];
  close: [];
  minimize: [];
  fullscreen: [];
  open: [];
}>();

const open = ref(false);
const backRef = ref<HTMLButtonElement | null>(null);
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
  hasSubmenu?: boolean;
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
    [t('AITools.Entry'), IconAISubtitles],
    [t('Settings.Title'), IconSettings],
  ];
  return icons.find(([text]) => text === label)?.[1];
}

function onOpen(next: boolean) {
  open.value = next;
  if (next) {
    emit('open');
    return;
  }
  emit('close');
}

function runSubmenu(act?: string) {
  if (!act || !props.submenu?.run(act)) {
    return;
  }
  open.value = false;
  emit('close');
}

watch(() => props.submenu, (menu) => {
  if (!menu || !open.value) {
    return;
  }
  void nextTick(() => backRef.value?.focus());
});

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

.overflow-menu-entry {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 32px;
  padding: 0 12px;
  color: var(--rk-text-primary);
  font: inherit;
  font-size: var(--rk-fs-md);
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

.overflow-menu-sub {
  display: flex;
  flex-direction: column;
}

.overflow-menu-back {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 100%;
  padding: 8px 10px;
  color: var(--rk-text-primary);
  font: inherit;
  font-size: var(--rk-fs-md);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 12px;
}

.overflow-menu-back:hover {
  background: color-mix(in srgb, var(--rk-text-primary) 5%, transparent);
}

.overflow-menu-back-icon {
  flex: none;
  transform: rotate(90deg);
}

.overflow-menu-sub-split {
  height: 1px;
  margin: 4px 2px;
  background: var(--rk-border);
}

.overflow-menu-sub-hint {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  color: var(--rk-text-secondary);
  font-size: var(--rk-fs-sm);
  line-height: 1.4;
  white-space: nowrap;
}

.overflow-menu-sub-hint :deep(svg) {
  flex: none;
  color: var(--rk-brand);
}

.overflow-menu-sub-item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  color: var(--rk-text-primary);
  font: inherit;
  font-size: var(--rk-fs-md);
  line-height: 20px;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 12px;
}

.overflow-menu-sub-item:hover {
  background: color-mix(in srgb, var(--rk-text-primary) 5%, transparent);
}

.overflow-menu-sub-item.is-on,
.overflow-menu-sub-item.is-on :deep(svg) {
  color: var(--rk-brand);
}

.overflow-menu-sub-item:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.overflow-menu-sub-item:disabled:hover {
  background: transparent;
}
</style>

<style lang="scss">
.rk-dropdown:has(.overflow-menu-sub) {
  box-sizing: border-box;
  width: max-content;
  min-width: 0;
}
</style>
