<template>
  <TUIDropdown
    v-model:open="menuOpen"
    trigger="click"
    placement="top"
    :offset="12"
    @command="onMenuCommand"
  >
    <ToolbarButtonPC
      :label="t('AITools.Entry')"
      :icon="IconAISubtitles"
      :active="active"
      hide-menu
      :overflow-behavior="overflowBehavior"
    />
    <template #menu>
      <CaptionEntryMenu :transcript-open="transcriptOpen" />
    </template>
  </TUIDropdown>
  <CaptionConfirmDialog />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { IconAISubtitles, TUIDropdown, t } from '../../../base';
import type { OverflowBehavior } from '../../../layouts/OverflowToolbarPC/overflowItem';
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
const menu = useCaptionEntryMenu(
  () => props.transcriptOpen,
  () => emit('toggle-transcript'),
);

function onMenuCommand(command: string | number) {
  menu.run(String(command));
}

/** Collapsed into the more menu, the same actions drill in place there. */
const overflowBehavior = computed<OverflowBehavior>(() => ({
  submenu: {
    title: t('AITools.Entry'),
    note: menu.note.value,
    items: menu.items.value,
    run: menu.run,
  },
}));
</script>
