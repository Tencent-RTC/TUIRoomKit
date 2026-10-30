<template>
  <TUIDropdown
    v-if="entries.length > 0"
    ref="dropdownRef"
    :open="menuOpen"
    trigger="click"
    placement="top"
    :offset="12"
    @update:open="onMenuOpen"
    @command="onCommand"
  >
    <ToolbarButtonPC
      :label="label"
      overflow-key="ScreenShare.Share"
      :icon="IconShare"
      :active="isSharing"
      :blocked="isShareBlocked"
      :loading="isBusy"
      :notice="hasScreenFault"
    />
    <template #menu>
      <TUIDropdownItem
        v-for="item in menuItems"
        :key="item.act"
        :command="item.act"
      >
        <component :is="item.icon" class="screen-share-menu-icon" :size="16" />
        {{ item.label }}
      </TUIDropdownItem>
    </template>
  </TUIDropdown>
  <ToolbarButtonPC
    v-else
    :label="label"
    overflow-key="ScreenShare.Share"
    :icon="IconShare"
    :active="isSharing"
    :blocked="isShareBlocked"
    :loading="isBusy"
    :notice="hasScreenFault"
    @click="toggleScreenShare"
  />
  <slot />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { IconShare, TUIDropdown, TUIDropdownItem, TUIMessageBox, TUIToast, t } from '../../../base';
import { hasInterceptor, runInterceptors } from '../../../core/interceptors';
import { bindOverflowSubmenu, OVERFLOW_SUBMENU_READY } from '../../../layouts/OverflowToolbarPC/overflowSubmenu';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';
import { SCREEN_SHARE_ENTRY_KEY, useScreenShare } from './useScreenShare';
import { confirmStopScreenShare } from './confirmStopScreenShare';
import type { ScreenShareEntry, ScreenShareFailure } from './useScreenShare';

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
  isBusy,
  canShareScreen,
  hasScreenFault,
  isScreenCaptureUnsupported,
  isLocalSharing,
  isRemoteSharing,
  startScreenShare,
  stopScreenShare,
} = useScreenShare();

const activeEntry = computed(() => entries.value.find(entry => entry.active));
const isSharing = computed(() => isLocalSharing.value || !!activeEntry.value);
const label = computed(() => {
  if (activeEntry.value) {
    return activeEntry.value.stopLabel;
  }
  return isLocalSharing.value ? t('ScreenShare.StopConfirm') : t('ScreenShare.Share');
});
/** Host and admin keep control; a share already in progress can still be stopped. */
const isShareBlocked = computed(() => !canShareScreen.value && !isSharing.value);
const menuItems = computed(() => [
  { act: 'screen', label: t('ScreenShare.StartConfirm'), icon: IconShare },
  ...entries.value.map(entry => ({ act: entry.act, label: entry.label, icon: entry.icon })),
]);

function notifyFailure(reason: ScreenShareFailure) {
  if (reason === 'capture') {
    return;
  }
  const type = reason === 'failed' ? 'error' : 'warning';
  TUIToast[type](t(`ScreenShare.Failure.${reason}`));
}

async function startWithConfirm() {
  if (!canShareScreen.value) {
    notifyFailure('not-allowed');
    return;
  }
  if (isRemoteSharing.value) {
    notifyFailure('remote-sharing');
    return;
  }
  if (!isScreenCaptureUnsupported.value && hasInterceptor('startScreenShare')) {
    if (!await runInterceptors('startScreenShare')) {
      return;
    }
  } else if (!isScreenCaptureUnsupported.value) {
    const confirmed = await TUIMessageBox.confirm({
      title: t('ScreenShare.StartTitle'),
      message: t('ScreenShare.StartMessage'),
      confirmText: t('ScreenShare.StartConfirm'),
      cancelText: t('ScreenShare.Cancel'),
    });
    if (!confirmed) {
      return;
    }
  }
  /**
   * No success toast: when two people start sharing at once the engine keeps
   * only one stream, so a toast here would confirm a share that is about to be
   * dropped. Silence means success; the active button state is the feedback.
   */
  const failure = await startScreenShare();
  if (failure) {
    notifyFailure(failure);
  }
}

function toggleScreenShare() {
  void (isLocalSharing.value ? confirmStopScreenShare(stopScreenShare) : startWithConfirm());
}

function stopShare() {
  if (activeEntry.value) {
    activeEntry.value.stop();
    return;
  }
  toggleScreenShare();
}

function runItem(act: string) {
  if (act === 'screen') {
    void startWithConfirm();
    return;
  }
  entries.value.find(entry => entry.act === act)?.run();
}

const menuOpen = ref(false);

/** Nothing in the menu applies while someone else shares, so say why instead of opening it. */
function canOpenMenu(): boolean {
  if (!canShareScreen.value) {
    notifyFailure('not-allowed');
    return false;
  }
  if (isRemoteSharing.value) {
    notifyFailure('remote-sharing');
    return false;
  }
  return true;
}

function onMenuOpen(open: boolean) {
  if (open && isSharing.value) {
    menuOpen.value = false;
    stopShare();
    return;
  }
  menuOpen.value = open && canOpenMenu();
}

function onCommand(act: string | number) {
  menuOpen.value = false;
  runItem(String(act));
}

const dropdownRef = ref<ComponentPublicInstance | null>(null);
let unbindSubmenu = () => {};
let submenuHost: HTMLElement | null = null;

function keepCollapsedClosed(event: MouseEvent) {
  if (submenuHost && getComputedStyle(submenuHost).display === 'none') {
    event.stopPropagation();
    // While sharing there is no submenu, so the more menu clicks the button directly.
    if (isSharing.value) {
      stopShare();
    }
  }
}

/** TUIDropdown is multi-root, so `$el` is the fragment comment, not the anchor. */
function resolveDropdownAnchor(root: Node | null | undefined): HTMLElement | null {
  const nested = (node: HTMLElement) => {
    if (node.classList.contains('rk-dropdown-anchor')) {
      return node;
    }
    const anchor = node.querySelector('.rk-dropdown-anchor');
    return anchor instanceof HTMLElement ? anchor : null;
  };
  if (root instanceof HTMLElement) {
    return nested(root);
  }
  const next = root instanceof CharacterData ? root.nextElementSibling : null;
  return next instanceof HTMLElement ? nested(next) : null;
}

function unbindMenuHost() {
  submenuHost?.removeEventListener('click', keepCollapsedClosed, true);
  unbindSubmenu();
  unbindSubmenu = () => {};
  submenuHost = null;
}

function bindMenuHost() {
  unbindMenuHost();
  const el = resolveDropdownAnchor(dropdownRef.value?.$el);
  if (!el) {
    return;
  }
  submenuHost = el;
  el.addEventListener('click', keepCollapsedClosed, true);
  if (isSharing.value) {
    // The more menu caches whether an entry drills; ask it to re-read now that this one does not.
    el.dispatchEvent(new CustomEvent(OVERFLOW_SUBMENU_READY, { bubbles: true }));
    return;
  }
  // The more menu reads this while the button is collapsed, and drills in place.
  unbindSubmenu = bindOverflowSubmenu(el, () => ({
    title: t('ScreenShare.Share'),
    hint: '',
    items: menuItems.value,
    run: (act) => {
      if (canOpenMenu()) {
        runItem(act);
      }
      return true;
    },
  }));
}

onMounted(bindMenuHost);
watch([dropdownRef, isSharing], bindMenuHost, { flush: 'post' });
onBeforeUnmount(unbindMenuHost);

defineExpose({ toggleScreenShare });
</script>
<style scoped lang="scss">
.screen-share-menu-icon {
  flex: none;
  margin-right: 8px;
  color: var(--rk-text-secondary);
}
</style>
