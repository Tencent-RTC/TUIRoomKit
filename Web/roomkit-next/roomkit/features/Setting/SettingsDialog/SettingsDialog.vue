<template>
  <Teleport v-if="host" :to="host">
    <div
      v-if="open"
      class="settings-mask"
      :style="{ zIndex }"
      @click.self="$emit('close')"
    >
      <div
        ref="panelRef"
        class="settings-dialog"
        :class="{ 'is-nav-compact': compactNav, 'is-nav-open': navOpen }"
        role="dialog"
        aria-modal="true"
        :aria-label="t('Settings.Title')"
        tabindex="-1"
        :style="{ left: `${x}px`, top: `${y}px` }"
      >
        <div
          v-if="compactNav && navOpen"
          class="settings-nav-backdrop"
          @click="navOpen = false"
        />
        <nav class="settings-nav" :aria-label="t('Settings.Nav')">
          <div class="settings-nav-title">
            {{ t('Settings.Title') }}
          </div>
          <button
            v-for="tab in TABS"
            :key="tab.id"
            class="settings-nav-item"
            :class="{ 'is-active': tab.id === activeTab }"
            type="button"
            :aria-current="tab.id === activeTab"
            @click="selectTab(tab.id)"
          >
            <component :is="tab.icon" />
            <span class="settings-nav-name">{{ t(tab.labelKey) }}</span>
          </button>
        </nav>

        <section class="settings-content">
          <header class="settings-header">
            <button
              v-if="compactNav"
              class="settings-nav-toggle"
              type="button"
              :aria-label="navOpen ? t('Settings.CloseNav') : t('Settings.OpenNav')"
              :aria-expanded="navOpen"
              @click="navOpen = !navOpen"
            >
              <IconChevron :size="16" />
            </button>
            <h3 class="settings-content-title">{{ t(currentTab.titleKey) }}</h3>
            <button
              class="settings-close"
              type="button"
              :aria-label="t('Settings.Close')"
              @click="$emit('close')"
            >
              <IconClose />
            </button>
          </header>
          <div class="settings-body">
            <component :is="currentTab.component" />
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, watch } from 'vue';
import type { Component } from 'vue';
import {
  IconCam,
  IconChevron,
  IconClose,
  IconImage,
  IconMic,
  IconSettings,
  IconShare,
} from '../../../base';
import { useModality, useOverlay, useVisibleCenter } from '../../../base/headless';
import { t } from '../../../i18n';
import AudioSettings from '../../Device/AudioSettings.vue';
import VideoSettings from '../../Device/VideoSettings/index.vue';
import ShareSettings from '../../ScreenShare/ShareSettings/ShareSettings.vue';
import GeneralSettings from '../GeneralSettings/GeneralSettings.vue';
import VideoEffectSettings from './VideoEffectSettings.vue';

export type SettingsTab = 'audio' | 'video' | 'videoEffect' | 'share' | 'general';

interface SettingsTabConfig {
  id: SettingsTab;
  icon: Component;
  labelKey: string;
  titleKey: string;
  component: Component;
}

/** Tab order matches the design nav; VideoEffectSettings composes the two feature pages. */
const TABS: SettingsTabConfig[] = [
  { id: 'audio', icon: IconMic, labelKey: 'Settings.TabAudio', titleKey: 'Settings.AudioTitle', component: AudioSettings },
  { id: 'video', icon: IconCam, labelKey: 'Settings.TabVideo', titleKey: 'Settings.VideoTitle', component: VideoSettings },
  { id: 'videoEffect', icon: IconImage, labelKey: 'Settings.TabVideoEffect', titleKey: 'Settings.VideoEffectTitle', component: VideoEffectSettings },
  { id: 'share', icon: IconShare, labelKey: 'Settings.TabShare', titleKey: 'Settings.ShareTitle', component: ShareSettings },
  { id: 'general', icon: IconSettings, labelKey: 'Settings.TabGeneral', titleKey: 'Settings.GeneralTitle', component: GeneralSettings },
];

const props = defineProps<{
  open: boolean;
  activeTab: SettingsTab;
}>();

const emit = defineEmits<{
  close: [];
  select: [tab: SettingsTab];
}>();

const NAV_COMPACT_WIDTH = 560;

const panelRef = ref<HTMLElement | null>(null);
const openRef = toRef(props, 'open');
const navOpen = ref(false);
const compactNav = ref(false);
const currentTab = computed(() =>
  TABS.find(tab => tab.id === props.activeTab) ?? TABS[0],
);

let navCompactObserver: ResizeObserver | null = null;

function updateCompactNav(width: number) {
  const next = width > 0 && width < NAV_COMPACT_WIDTH;
  if (compactNav.value && !next) {
    navOpen.value = false;
  }
  compactNav.value = next;
}

function bindNavCompactObserver(el: HTMLElement | null) {
  navCompactObserver?.disconnect();
  navCompactObserver = null;
  if (!el) {
    return;
  }
  navCompactObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width ?? 0;
    updateCompactNav(width);
  });
  navCompactObserver.observe(el);
}

function selectTab(id: SettingsTab) {
  emit('select', id);
  if (compactNav.value) {
    navOpen.value = false;
  }
}

watch(panelRef, (el) => bindNavCompactObserver(el), { immediate: true });

watch(openRef, (open) => {
  if (!open) {
    navOpen.value = false;
    return;
  }
  if (panelRef.value) {
    updateCompactNav(panelRef.value.offsetWidth);
  }
});

onBeforeUnmount(() => {
  navCompactObserver?.disconnect();
});

const { host, zIndex, ctx } = useOverlay({
  lane: 'dialog',
  open: openRef,
  closeOnOutside: false,
  modal: true,
  onClose: () => emit('close'),
}, [panelRef]);

useModality(openRef, panelRef, ctx?.root);
const { x, y } = useVisibleCenter(host, panelRef, openRef);
</script>

<style scoped lang="scss">
.settings-mask {
  position: absolute;
  inset: 0;
  container-name: settings-host;
  container-type: size;
  overscroll-behavior: contain;
  pointer-events: auto;
  background: var(--rk-bg-overlay);
  backdrop-filter: blur(6px);
}

.settings-dialog {
  position: absolute;
  display: flex;
  width: min(720px, calc(100% - 48px));
  min-width: 0;
  height: min(580px, calc(100% - 48px));
  min-height: 0;
  overflow: hidden;
  container-name: settings-dialog;
  container-type: size;
  background: var(--rk-bg-surface);
  border-radius: var(--rk-radius-lg);
  outline: none;
  box-shadow: var(--rk-shadow-dialog);
}

.settings-nav-backdrop {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: color-mix(in srgb, #000 20%, transparent);
  border-radius: inherit;
}

.settings-nav {
  display: flex;
  flex: 0 0 168px;
  flex-direction: column;
  gap: 2px;
  padding: var(--rk-space-4) var(--rk-space-3);
  overflow-y: auto;
  scrollbar-width: none;
  background: var(--rk-bg-page);
  border-right: 1px solid var(--rk-border);
}

.settings-nav::-webkit-scrollbar {
  display: none;
}

.settings-dialog.is-nav-compact .settings-nav {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 3;
  flex: none;
  width: 168px;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateX(-100%);
}

.settings-dialog.is-nav-compact.is-nav-open .settings-nav {
  transform: translateX(0);
}

.settings-nav-title {
  padding: 0 var(--rk-space-2) var(--rk-space-4);
  font-size: 15px;
  font-weight: 600;
  color: var(--rk-text-primary);
}

.settings-nav-item {
  display: flex;
  gap: var(--rk-space-2);
  align-items: center;
  padding: var(--rk-space-2) var(--rk-space-2);
  font: inherit;
  font-size: 13px;
  color: var(--rk-text-secondary);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--rk-radius-md);
  transition: background var(--rk-duration) var(--rk-ease);
}

.settings-nav-item:hover {
  background: var(--rk-bg-muted);
}

.settings-nav-item.is-active,
.settings-nav-item.is-active:hover {
  color: var(--rk-on-accent);
  background: var(--rk-brand);
}

.settings-nav-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.settings-header {
  display: flex;
  flex-shrink: 0;
  gap: var(--rk-space-3);
  align-items: center;
  justify-content: space-between;
  padding: var(--rk-space-4) var(--rk-space-5) var(--rk-space-2);
}

.settings-nav-toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: var(--rk-bg-muted);
  border: 0;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}

.settings-nav-toggle:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.settings-nav-toggle :deep(.rk-icon) {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  transform: rotate(-90deg);
}

.settings-dialog.is-nav-open .settings-nav-toggle :deep(.rk-icon) {
  transform: rotate(90deg);
}

.settings-content-title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--rk-text-primary);
  letter-spacing: -0.01em;
}

/* Bare glyph until hovered, like the other close buttons in the package: the resting
   state carries no fill, and hover puts a square-cornered plate behind the icon. */
.settings-close {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--rk-radius-sm);
  transition: color 0.15s, background 0.15s;
}

.settings-close:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.settings-body {
  flex: 1;
  min-height: 0;
  padding: var(--rk-space-2) var(--rk-space-5) var(--rk-space-5);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.settings-body::-webkit-scrollbar {
  display: none;
}

@container settings-host (max-width: 768px) {
  .settings-dialog {
    width: calc(100% - 24px);
    height: min(88%, calc(100% - 24px));
  }
}

@container settings-host (max-height: 528px) {
  .settings-dialog {
    height: calc(100% - 24px);
  }
}
</style>
