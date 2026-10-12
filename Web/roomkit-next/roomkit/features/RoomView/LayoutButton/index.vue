<template>
  <TUIDropdown
    placement="bottom-end"
    @command="handleCommand"
    @update:open="open = $event"
  >
    <TopbarButton :icon="IconLayout" :label="t('Layout.Title')" :active="open" />

    <template #menu>
      <TUIDropdownItem
        v-for="option in options"
        :key="option.value"
        :command="option.value"
      >
        <span
          class="layout-button-option"
          :class="{ 'is-current': layoutTemplate === option.value }"
        >
          <span
            class="layout-button-preview"
            :class="`layout-button-preview-${option.preview}`"
            aria-hidden="true"
          >
            <i v-for="cell in option.cells" :key="cell" />
          </span>
          <span class="layout-button-label">{{ t(option.label) }}</span>
        </span>
      </TUIDropdownItem>
    </template>
  </TUIDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconLayout, TUIDropdown, TUIDropdownItem } from '../../../base';
import { t } from '../../../i18n';
import { RoomLayoutTemplate } from '../../../core/types';
import TopbarButton from '../../../layouts/TopbarButton.vue';

defineProps<{
  layoutTemplate: RoomLayoutTemplate;
}>();

const emit = defineEmits<{
  'update:layoutTemplate': [template: RoomLayoutTemplate];
}>();

/** `cells` is how many blocks the preview thumbnail draws; the shape comes from CSS. */
const options = [
  { label: 'Layout.Grid', value: RoomLayoutTemplate.GridLayout, preview: 'grid', cells: 9 },
  { label: 'Layout.GalleryRight', value: RoomLayoutTemplate.SidebarLayout, preview: 'sidebar', cells: 4 },
  { label: 'Layout.GalleryTop', value: RoomLayoutTemplate.CinemaLayout, preview: 'cinema', cells: 4 },
] as const;

const open = ref(false);

function handleCommand(command: string | number) {
  if (
    command === RoomLayoutTemplate.GridLayout
    || command === RoomLayoutTemplate.SidebarLayout
    || command === RoomLayoutTemplate.CinemaLayout
  ) {
    emit('update:layoutTemplate', command);
  }
}
</script>

<style scoped lang="scss">
.layout-button-option {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  color: var(--rk-text-primary);
}

.layout-button-label {
  font-size: 12px;
  font-weight: 500;
}

/* A miniature of the layout: the blocks are tinted from the label colour, so the
   current item turns brand-coloured and both themes follow without a second palette. */
.layout-button-preview {
  display: grid;
  flex: 0 0 auto;
  gap: 1.5px;
  width: 24px;
  height: 24px;
  padding: 5px;
  background: var(--rk-bg-muted);
  border-radius: 6px;
}

.layout-button-preview i {
  background: color-mix(in srgb, currentcolor 18%, transparent);
  border-radius: 2px;
}

.layout-button-preview-grid {
  grid-template-rows: repeat(3, 1fr);
  grid-template-columns: repeat(3, 1fr);
}

/* Speaker block on the left, a column of thumbnails on the right */
.layout-button-preview-sidebar {
  grid-template-rows: repeat(3, 1fr);
  grid-template-columns: 22fr 10fr;

  i:first-child {
    grid-row: 1 / -1;
  }
}

/* A row of thumbnails on top, the speaker below */
.layout-button-preview-cinema {
  grid-template-rows: 7fr 14fr;
  grid-template-columns: repeat(3, 1fr);

  i:last-child {
    grid-column: 1 / -1;
  }
}

.layout-button-option.is-current {
  color: var(--rk-brand);
}

.layout-button-option.is-current .layout-button-label {
  font-weight: 600;
}

.layout-button-option.is-current .layout-button-preview {
  background: color-mix(in srgb, currentcolor 6%, transparent);
  box-shadow: inset 0 0 0 1px currentcolor;
}

.layout-button-option.is-current .layout-button-preview i {
  background: color-mix(in srgb, currentcolor 45%, transparent);
}
</style>

<!-- The dropdown panel and its rows belong to the base component and are teleported
     out of this subtree, so they need an unscoped rule keyed on our own row class. -->
<style lang="scss">
.rk-float.rk-dropdown:has(.layout-button-option) {
  width: 169px;
  min-width: 0;
  padding: 5px;
}

.rk-dropdown-item:has(.layout-button-option) {
  min-height: 42px;
  padding: 5px 6px;
  border-radius: 8px;
}

.rk-dropdown-item:has(.layout-button-option.is-current) {
  background: color-mix(in srgb, var(--rk-brand) 14%, transparent);
}
</style>
