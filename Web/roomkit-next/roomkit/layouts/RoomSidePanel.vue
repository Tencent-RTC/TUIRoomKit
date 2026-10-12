<template>
  <aside
    class="room-side-panel"
    :class="{ 'is-closed': !openedTabs.length }"
    :aria-label="t('Room.SidePanel')"
    :aria-hidden="!openedTabs.length ? 'true' : undefined"
  >
    <header class="room-side-panel-header">
      <nav ref="tabsRef" class="room-side-panel-tabs" :aria-label="t('Room.SidePanelNav')">
        <div
          v-for="tab in openedTabs"
          :key="tab.id"
          class="room-side-panel-tab-item"
          :class="{ 'room-side-panel-tab-active': tab.id === activeId }"
        >
          <button class="room-side-panel-tab" type="button" @click="select(tab.id)">
            <component
              :is="tab.icon"
              v-if="tab.icon"
              :size="14"
            />
            {{ tab.label }}
          </button>
          <button
            class="room-side-panel-tab-close"
            type="button"
            :aria-label="t('Room.CloseTab', { name: tab.label })"
            @click.stop="close(tab.id)"
          >
            <IconClose :size="8" />
          </button>
        </div>
        <!-- Sliding active-tab indicator; left/width driven by JS like .single-tab-indicator -->
        <span class="room-side-panel-tab-indicator" :style="indicatorStyle" aria-hidden="true" />
      </nav>

      <button
        class="room-side-panel-close"
        type="button"
        :aria-label="t('Room.CloseSidePanel')"
        @click="closeAll"
      >
        <IconClose :size="12" />
      </button>
    </header>

    <div class="room-side-panel-body">
      <slot :active-id="activeId" :opened="opened">
        <div class="room-side-panel-placeholder">
          {{ activeLabel }}
        </div>
      </slot>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { Component } from 'vue';
import { IconClose } from '../base';
import { t } from '../i18n';

export interface SidePanelTab {
  id: string;
  label: string;
  icon?: Component;
}

/** `tabs` is the catalog; the scene holds which of them are open. */
const props = defineProps<{
  tabs: SidePanelTab[];
  opened: string[];
  activeId: string | null;
}>();

const emit = defineEmits<{
  'update:opened': [ids: string[]];
  'update:activeId': [id: string | null];
}>();

function isKnown(id: string) {
  return props.tabs.some(tab => tab.id === id);
}

function open(id: string) {
  if (!isKnown(id)) {
    return;
  }
  if (!props.opened.includes(id)) {
    emit('update:opened', [...props.opened, id]);
  }
  emit('update:activeId', id);
}

function select(id: string) {
  if (!props.opened.includes(id)) {
    return;
  }
  emit('update:activeId', id);
}

function close(id: string) {
  const index = props.opened.indexOf(id);
  if (index < 0) {
    return;
  }

  const next = props.opened.filter(item => item !== id);
  emit('update:opened', next);
  if (props.activeId !== id) {
    return;
  }
  // Fall back to the tab that slid into this slot, else the one before it.
  emit('update:activeId', next[index] ?? next[index - 1] ?? null);
}

function toggle(id: string) {
  if (props.activeId === id) {
    close(id);
    return;
  }
  open(id);
}

function closeAll() {
  emit('update:opened', []);
  emit('update:activeId', null);
}

const openedTabs = computed(
  () => props.opened.flatMap(id => props.tabs.filter(tab => tab.id === id)),
);

const activeLabel = computed(
  () => props.tabs.find(tab => tab.id === props.activeId)?.label ?? '',
);

defineExpose({ open, select, close, toggle, closeAll });

// ---------------------------------------------------------------------------
// Sliding tab indicator — mirrors .single-tab-indicator from the design reference.
// Position is recalculated whenever the active tab or the tab list changes.
// ---------------------------------------------------------------------------
const tabsRef = ref<HTMLElement | null>(null);
const indicatorStyle = ref({ left: '0px', width: '0px' });

async function updateIndicator(): Promise<void> {
  await nextTick();
  const nav = tabsRef.value;
  if (!nav || !props.activeId) {
    indicatorStyle.value = { left: '0px', width: '0px' };
    return;
  }
  const activeItem = nav.querySelector<HTMLElement>('.room-side-panel-tab-active');
  if (!activeItem) {
    indicatorStyle.value = { left: '0px', width: '0px' };
    return;
  }
  // Measure the full tab-item (including the close button) so the indicator
  // spans the same width as the clickable tab row item.
  const navRect = nav.getBoundingClientRect();
  const tabRect = activeItem.getBoundingClientRect();
  indicatorStyle.value = {
    left: `${tabRect.left - navRect.left + nav.scrollLeft}px`,
    width: `${tabRect.width}px`,
  };
}

onMounted(updateIndicator);
watch([() => props.activeId, openedTabs], updateIndicator);
</script>

<style scoped lang="scss">
/* The root box is the mounter's: it sets the column, the surface and the clipping.
   Everything below only styles what lives inside the panel. */

/* Slide in from the right on open; slide back out on close. The mounter that
   also animates the space around the panel overrides this with its own timing. */
.room-side-panel {
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
  transform: translateX(0);
}

/* The mounter adds an exit gap when its own clipping box reaches past the slot
   this panel sits in; without it the panel parks inside that strip. */
.room-side-panel.is-closed {
  pointer-events: none;
  transform: translateX(calc(100% + var(--side-panel-exit-gap, 0px)));
}

.room-side-panel-header {
  display: flex;
  flex: 0 0 44px;
  align-items: stretch;
  height: 44px;
  border-bottom: 1px solid var(--rk-border);
}

.room-side-panel-tabs {
  position: relative; /* Required for the absolute-positioned indicator */
  display: flex;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.room-side-panel-tabs::-webkit-scrollbar {
  display: none;
}

/* Mirrors .single-tab: the item itself carries the padding, gap and typography,
   so the indicator can span it while its contents stay centered. */
.room-side-panel-tab-item {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 0 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--rk-text-secondary);
  letter-spacing: -0.005em;
  transition: color 0.15s;
}

/* Text color only — the design's hover background resolves to the panel's own
   surface color, so it never reads as a plate. */
.room-side-panel-tab-item:hover {
  color: var(--rk-text-primary);
}

/* Active tab keeps its brand color even while hovered.
   Specificity (0,3,0) beats the plain :hover rule (0,2,0). */
.room-side-panel-tab-item.room-side-panel-tab-active:hover {
  color: var(--rk-info);
}

.room-side-panel-tab-item + .room-side-panel-tab-item {
  margin-left: 4px;
}

/* Bare click target — all spacing and typography come from the item above. */
.room-side-panel-tab {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  align-self: stretch;
  padding: 0;
  font: inherit;
  color: inherit;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.room-side-panel-tab :deep(.rk-icon) {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.room-side-panel-tab-active .room-side-panel-tab :deep(.rk-icon) {
  opacity: 1;
}

.room-side-panel-tab-active {
  color: var(--rk-info);
}

/* Sliding indicator — left/width set by JS; mirrors .single-tab-indicator. */
.room-side-panel-tab-indicator {
  position: absolute;
  bottom: -1px; /* Overlaps the header border, identical to the design */
  left: 0;
  width: 0;
  height: 2px;
  pointer-events: none;
  background: var(--rk-info);
  border-radius: var(--rk-radius-pill);
  transition: left 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Tab close: hidden by default, revealed on tab hover — matches .single-tab-close. */
.room-side-panel-tab-close {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  padding: 0;
  margin: 0;
  font: inherit;
  line-height: 1;
  color: currentcolor;
  pointer-events: none;
  cursor: pointer;
  background: none;
  border: 0;
  border-radius: 0;
  opacity: 0;
  transition: opacity 0.12s;
}

/* Reveal the close button only when the mouse is over that tab item.
   Intentionally excludes :focus-within — otherwise clicking the tab button
   would keep the close visible until focus moves away. */
.room-side-panel-tab-item:hover .room-side-panel-tab-close {
  pointer-events: auto;
  opacity: 0.72;
}

/* Needs to outrank the rule above, which would otherwise pin it at 0.72. */
.room-side-panel-tab-item:hover .room-side-panel-tab-close:hover {
  opacity: 1;
}

.room-side-panel-tab-close :deep(.rk-icon) {
  width: 8px;
  height: 8px;
}

/* Whole-rail close matches .single-topbar-close: 20×20, 6px square hover plate. */
.room-side-panel-close {
  display: inline-flex;
  flex: 0 0 20px;
  align-items: center;
  align-self: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  margin: 0 8px 0 4px;
  color: var(--rk-text-tertiary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}

.room-side-panel-close:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.room-side-panel-close:active {
  background: color-mix(in srgb, var(--rk-text-primary) 12%, transparent);
}

.room-side-panel-close :deep(.rk-icon) {
  width: 12px;
  height: 12px;
}

.room-side-panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.room-side-panel-placeholder {
  display: grid;
  place-items: center;
  height: 100%;
  font-size: 13px;
  color: var(--rk-text-secondary);
}
</style>
