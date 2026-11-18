<template>
  <TUIDropdown
    :open="menuOpen"
    trigger="click"
    placement="top"
    :offset="12"
    @update:open="onMenuOpen"
    @command="onCommand"
  >
    <ToolbarButtonPC
      :label="label"
      :icon="IconShare"
      :active="isSharing"
      :blocked="mode === 'blocked'"
      :loading="isBusy"
      :notice="hasScreenFault"
      :overflow-behavior="overflowBehavior"
    />
    <template #menu>
      <TUIDropdownItem
        v-for="item in menuItems"
        :key="item.command"
        :command="item.command"
      >
        <component :is="item.icon" class="screen-share-menu-icon" :size="16" />
        {{ item.label }}
      </TUIDropdownItem>
    </template>
  </TUIDropdown>
  <slot />
</template>

<script setup lang="ts">
import { computed, provide, ref, shallowRef } from 'vue';
import { DeviceError, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconShare, TUIDropdown, TUIDropdownItem, t } from '../../../base';
import type { OverflowBehavior } from '../../../layouts/OverflowToolbarPC/overflowItem';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';
import { SCREEN_SHARE_ENTRY_KEY, useScreenShare } from '../useScreenShare';
import type { ScreenShareEntry } from '../useScreenShare';

defineSlots<{
  /** Renderless entries that inject `SCREEN_SHARE_ENTRY_KEY`; any entry turns the control into a menu. */
  default?(): unknown;
}>();

const sources = shallowRef<Array<() => ScreenShareEntry>>([]);
const entries = computed(() => sources.value.map(source => source()));

provide(SCREEN_SHARE_ENTRY_KEY, (source) => {
  sources.value = [...sources.value, source];
  return () => {
    sources.value = sources.value.filter(item => item !== source);
  };
});

const {
  holder,
  isBusy,
  canShare,
  ensureCanStart,
  startScreenShare,
  stopScreenShare,
} = useScreenShare();
const { screenLastError } = useDeviceState();

const hasScreenFault = computed(() => screenLastError.value !== DeviceError.NoError);
const activeEntry = computed(() => entries.value.find(entry => entry.active));
/** Any local share holds the control, the board included; an entry only names how to end it. */
const isSharing = computed(() => holder.value === 'local-screen' || holder.value === 'local-board');

/**
 * The one place that decides what picking the control does; the toolbar button and the
 * more-menu entry both read it, so the two never drift apart.
 * - stop: a local share holds the slot, picking it ends that share
 * - blocked: the user may not take the slot, picking it says why
 * - start: no extra entries, picking it starts a screen share
 * - menu: entries exist, picking it offers screen or an entry
 */
const mode = computed<'stop' | 'blocked' | 'start' | 'menu'>(() => {
  if (isSharing.value) {
    return 'stop';
  }
  if (!canShare.value) {
    return 'blocked';
  }
  return entries.value.length > 0 ? 'menu' : 'start';
});

const label = computed(() => {
  if (activeEntry.value) {
    return activeEntry.value.stopLabel;
  }
  return holder.value === 'local-screen' ? t('ScreenShare.StopConfirm') : t('ScreenShare.Share');
});
const menuItems = computed(() => [
  { command: 'screen', label: t('ScreenShare.StartConfirm'), icon: IconShare },
  ...entries.value.map(entry => ({ command: entry.command, label: entry.label, icon: entry.icon })),
]);

function stopShare() {
  if (activeEntry.value) {
    activeEntry.value.stop();
    return;
  }
  void stopScreenShare();
}

/** Picks the control in every mode but `menu`, which opens a list instead. */
function activate() {
  if (mode.value === 'stop') {
    stopShare();
  } else if (mode.value === 'blocked') {
    ensureCanStart();
  } else {
    void startScreenShare();
  }
}

function runItem(command: string) {
  if (command === 'screen') {
    void startScreenShare();
    return;
  }
  entries.value.find(entry => entry.command === command)?.run();
}

const overflowBehavior = computed<OverflowBehavior>(() => (mode.value === 'menu'
  ? {
    submenu: {
      title: t('ScreenShare.Share'),
      items: menuItems.value,
      // The slot may have been taken while the submenu stood open.
      run: (command) => {
        if (ensureCanStart()) {
          runItem(command);
        }
        return true;
      },
    },
  }
  : { select: activate }));

const menuOpen = ref(false);

function onMenuOpen(open: boolean) {
  if (open && mode.value !== 'menu') {
    menuOpen.value = false;
    activate();
    return;
  }
  menuOpen.value = open;
}

function onCommand(command: string | number) {
  menuOpen.value = false;
  runItem(String(command));
}
</script>
<style scoped lang="scss">
.screen-share-menu-icon {
  flex: none;
  margin-right: 8px;
  color: var(--rk-text-secondary);
}
</style>
