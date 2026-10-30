<template>
  <TUIDropdown
    ref="dropdownRef"
    v-model:open="menuOpen"
    trigger="click"
    placement="top"
    :offset="12"
    @command="onMenuCommand"
  >
    <ToolbarButtonPC
      :label="t('AITools.Entry')"
      overflow-key="AITools.Entry"
      :icon="IconAISubtitles"
      :active="active"
      hide-menu
    />
    <template #menu>
      <CaptionEntryMenu :transcript-open="transcriptOpen" />
    </template>
  </TUIDropdown>
  <CaptionConfirmDialog />
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { IconAISubtitles, TUIDropdown, t } from '../../../base';
import { bindOverflowSubmenu } from '../../../layouts/OverflowToolbarPC/overflowSubmenu';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';
import CaptionConfirmDialog from './CaptionConfirmDialog.vue';
import CaptionEntryMenu from './CaptionEntryMenu.vue';
import { useCaptionEntryMenu } from './useCaptionEntryMenu';

const props = defineProps<{
  transcriptOpen: boolean;
  active?: boolean;
}>();

const emit = defineEmits<{
  'toggle-transcript': [];
}>();

const menuOpen = ref(false);
const dropdownRef = ref<ComponentPublicInstance | null>(null);
const menu = useCaptionEntryMenu(
  () => props.transcriptOpen,
  () => emit('toggle-transcript'),
);

function onMenuCommand(command: string | number) {
  menu.run(String(command));
}

let unbindSubmenu = () => {};
let submenuHost: HTMLElement | null = null;

function keepCollapsedClosed(event: MouseEvent) {
  if (submenuHost && getComputedStyle(submenuHost).display === 'none') {
    event.stopPropagation();
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
  const next = root?.nextElementSibling;
  return next instanceof HTMLElement ? nested(next) : null;
}

onMounted(() => {
  const el = resolveDropdownAnchor(dropdownRef.value?.$el);
  if (!el) {
    return;
  }
  submenuHost = el;
  el.addEventListener('click', keepCollapsedClosed, true);
  // The more menu reads this while the button is collapsed, and drills in place.
  unbindSubmenu = bindOverflowSubmenu(el, () => ({
    title: t('AITools.Entry'),
    hint: menu.hint.value,
    items: menu.items.value,
    run: menu.run,
  }));
});

onBeforeUnmount(() => {
  submenuHost?.removeEventListener('click', keepCollapsedClosed, true);
  unbindSubmenu();
  submenuHost = null;
});
</script>
