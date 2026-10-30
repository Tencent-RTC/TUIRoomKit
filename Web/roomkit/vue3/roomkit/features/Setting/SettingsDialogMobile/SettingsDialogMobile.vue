<template>
  <Teleport v-if="host" :to="host">
    <div
      ref="rootRef"
      class="settings-dialog-mobile"
      :class="{ 'is-open': open, 'is-sub': !!pick }"
      :style="{ zIndex }"
      role="dialog"
      aria-modal="true"
      :aria-label="t('Settings.Title')"
      :aria-hidden="open ? undefined : 'true'"
    >
      <section class="settings-dialog-mobile-page settings-dialog-mobile-root" :aria-hidden="pick ? 'true' : undefined">
        <header class="settings-dialog-mobile-nav">
          <div
            class="settings-dialog-mobile-back"
            role="button"
            tabindex="0"
            :aria-label="t('Settings.Back')"
            @click="emit('close')"
            @keydown.enter.prevent="emit('close')"
          >
            <IconChevron class="settings-dialog-mobile-back-icon" :size="22" />
          </div>
          <h2 class="settings-dialog-mobile-title">
            {{ t('Settings.Title') }}
          </h2>
        </header>

        <div class="settings-dialog-mobile-body">
          <h3 class="settings-dialog-mobile-group">
            {{ t('Settings.TabVideo') }}
          </h3>
          <div class="settings-dialog-mobile-section">
            <div class="settings-dialog-mobile-row" :class="{ 'is-disabled': !isFrontCamera }">
              <div class="settings-dialog-mobile-text">
                <span class="settings-dialog-mobile-label">{{ t('Settings.Mirror') }}</span>
                <span class="settings-dialog-mobile-desc">{{ t('Settings.MirrorDesc') }}</span>
              </div>
              <TUISwitch
                size="lg"
                :model-value="mirrorEnabled"
                :disabled="!isFrontCamera"
                :aria-label="t('Settings.Mirror')"
                @change="toggleMirror"
              />
            </div>
            <div
              class="settings-dialog-mobile-row is-pickable"
              role="button"
              tabindex="0"
              @click="pushPick('resolution')"
              @keydown.enter.prevent="pushPick('resolution')"
            >
              <span class="settings-dialog-mobile-label">{{ t('Settings.Resolution') }}</span>
              <span class="settings-dialog-mobile-value">{{ currentLabel('resolution') }}</span>
              <IconChevron class="settings-dialog-mobile-arrow" :size="16" />
            </div>
          </div>

          <h3 class="settings-dialog-mobile-group">
            {{ t('Settings.TabGeneral') }}
          </h3>
          <div class="settings-dialog-mobile-section">
            <div
              v-for="key in generalPicks"
              :key="key"
              class="settings-dialog-mobile-row is-pickable"
              role="button"
              tabindex="0"
              @click="pushPick(key)"
              @keydown.enter.prevent="pushPick(key)"
            >
              <span class="settings-dialog-mobile-label">{{ t(PICKS[key].titleKey) }}</span>
              <span class="settings-dialog-mobile-value">{{ currentLabel(key) }}</span>
              <IconChevron class="settings-dialog-mobile-arrow" :size="16" />
            </div>
          </div>
        </div>
      </section>

      <section class="settings-dialog-mobile-page settings-dialog-mobile-sub" :aria-hidden="pick ? undefined : 'true'">
        <header class="settings-dialog-mobile-nav">
          <div
            class="settings-dialog-mobile-back"
            role="button"
            tabindex="0"
            :aria-label="t('Settings.Back')"
            @click="popPick"
            @keydown.enter.prevent="popPick"
          >
            <IconChevron class="settings-dialog-mobile-back-icon" :size="22" />
          </div>
          <h2 class="settings-dialog-mobile-title">
            {{ renderedPick ? t(PICKS[renderedPick].titleKey) : '' }}
          </h2>
        </header>

        <div class="settings-dialog-mobile-body">
          <div v-if="renderedPick" class="settings-dialog-mobile-section" role="radiogroup">
            <div
              v-for="option in PICKS[renderedPick].options"
              :key="option.value"
              class="settings-dialog-mobile-row is-pickable"
              role="radio"
              tabindex="0"
              :aria-checked="option.value === currentValue(renderedPick)"
              @click="selectOption(renderedPick, option.value)"
              @keydown.enter.prevent="selectOption(renderedPick, option.value)"
            >
              <span class="settings-dialog-mobile-label">{{ t(option.labelKey) }}</span>
              <IconCheck
                v-if="option.value === currentValue(renderedPick)"
                class="settings-dialog-mobile-check"
                :size="20"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, watch } from 'vue';
import { MirrorType, VideoQuality, useDeviceState } from 'tuikit-atomicx-vue3/room';
import {
  IconCheck,
  IconChevron,
  TUISwitch,
  TUIToast,
  useOverlay,
  useUIConfig,
  i18n,
  t,
} from '../../../base';
import type { ThemeName, Language } from '../../../base';
import type { SettingsItem } from '../GeneralSettings/GeneralSettings.vue';

type PickKey = 'resolution' | 'language' | 'theme';
type PickValue = VideoQuality | Language | ThemeName;

interface PickConfig {
  titleKey: string;
  options: Array<{ value: PickValue; labelKey: string }>;
}

const PICKS: Record<PickKey, PickConfig> = {
  resolution: {
    titleKey: 'Settings.Resolution',
    options: [
      { value: VideoQuality.Quality1080P, labelKey: 'Settings.Quality1080P' },
      { value: VideoQuality.Quality720P, labelKey: 'Settings.Quality720P' },
      { value: VideoQuality.Quality540P, labelKey: 'Settings.Quality540P' },
      { value: VideoQuality.Quality360P, labelKey: 'Settings.Quality360P' },
    ],
  },
  language: {
    titleKey: 'Settings.Language',
    options: [
      { value: 'zh-CN', labelKey: 'Settings.LanguageZhCN' },
      { value: 'en-US', labelKey: 'Settings.LanguageEnUS' },
    ],
  },
  theme: {
    titleKey: 'Settings.Theme',
    options: [
      { value: 'light', labelKey: 'Settings.ThemeLight' },
      { value: 'dark', labelKey: 'Settings.ThemeDark' },
    ],
  },
};

const GENERAL_PICKS: SettingsItem[] = ['language', 'theme'];

/** Long enough for the check mark to register before the list slides back. */
const AUTO_BACK_DELAY = 180;

const props = withDefaults(defineProps<{
  open: boolean;
  hiddenItems?: SettingsItem[];
}>(), {
  hiddenItems: () => [],
});

const generalPicks = computed(() => GENERAL_PICKS.filter(key => !props.hiddenItems.includes(key)));

const emit = defineEmits<{
  close: [];
}>();

const { isFrontCamera, localMirrorType, localVideoQuality, switchMirror, updateVideoQuality } = useDeviceState();
const { uiConfig, setUIConfig } = useUIConfig();

const rootRef = ref<HTMLElement | null>(null);
const pick = ref<PickKey | null>(null);
// Keeps the sub page painted while it slides back out.
const renderedPick = ref<PickKey | null>(null);
let backTimer = 0;

// The back camera never mirrors; the switch reads off there and comes back with the front one.
const mirrorEnabled = computed(() => isFrontCamera.value && localMirrorType.value !== MirrorType.Disable);

const { host, zIndex } = useOverlay({
  lane: 'dialog',
  open: toRef(props, 'open'),
  closeOnOutside: false,
  onClose: () => {
    if (pick.value) {
      popPick();
      return;
    }
    emit('close');
  },
}, [rootRef]);

function currentValue(key: PickKey): PickValue | undefined {
  if (key === 'resolution') {
    return localVideoQuality.value;
  }
  if (key === 'language') {
    return i18n.language as Language;
  }
  return uiConfig.theme;
}

function currentLabel(key: PickKey): string {
  const hit = PICKS[key].options.find(option => option.value === currentValue(key));
  return hit ? t(hit.labelKey) : '';
}

function pushPick(key: PickKey) {
  clearTimeout(backTimer);
  renderedPick.value = key;
  pick.value = key;
}

function popPick() {
  clearTimeout(backTimer);
  pick.value = null;
}

async function selectOption(key: PickKey, value: PickValue) {
  if (value !== currentValue(key)) {
    if (key === 'resolution') {
      try {
        await updateVideoQuality({ quality: value as VideoQuality });
      } catch {
        TUIToast.error(t('Settings.ResolutionFailed'));
        return;
      }
    } else if (key === 'language') {
      i18n.changeLanguage(value as Language);
    } else {
      setUIConfig({ theme: value as ThemeName });
    }
  }
  clearTimeout(backTimer);
  backTimer = window.setTimeout(popPick, AUTO_BACK_DELAY);
}

async function toggleMirror(enabled: boolean) {
  try {
    await switchMirror({ mirror: enabled ? MirrorType.Auto : MirrorType.Disable });
  } catch {
    TUIToast.error(t('Settings.MirrorFailed'));
  }
}

watch(() => props.open, (open) => {
  if (open) {
    clearTimeout(backTimer);
    pick.value = null;
    renderedPick.value = null;
  }
});

onBeforeUnmount(() => {
  clearTimeout(backTimer);
});
</script>

<style scoped lang="scss">
.settings-dialog-mobile {
  --settings-dialog-mobile-motion: 0.42s cubic-bezier(0.32, 0.72, 0, 1);

  position: absolute;
  inset: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
  pointer-events: none;
  visibility: hidden;
  background: var(--rk-bg-page);
  transition: transform var(--settings-dialog-mobile-motion), visibility 0s linear 0.42s;
  transform: translateX(100%);
}

.settings-dialog-mobile.is-open {
  pointer-events: auto;
  visibility: visible;
  transition: transform var(--settings-dialog-mobile-motion);
  transform: translateX(0);
}

.settings-dialog-mobile-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-top: env(safe-area-inset-top);
  background: var(--rk-bg-page);
  transition: transform var(--settings-dialog-mobile-motion);
}

/* Dims the root page as the sub page slides over it. */
.settings-dialog-mobile-root::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  background: color-mix(in srgb, var(--rk-text-primary) 8%, transparent);
  opacity: 0;
  transition: opacity 0.42s ease;
}

.settings-dialog-mobile-sub {
  visibility: hidden;
  transition: transform var(--settings-dialog-mobile-motion), visibility 0s linear 0.42s;
  transform: translateX(100%);
}

.settings-dialog-mobile.is-sub .settings-dialog-mobile-root {
  transform: translateX(-30%);
}

.settings-dialog-mobile.is-sub .settings-dialog-mobile-root::after {
  opacity: 1;
}

.settings-dialog-mobile.is-sub .settings-dialog-mobile-sub {
  visibility: visible;
  transition: transform var(--settings-dialog-mobile-motion);
  transform: translateX(0);
}

.settings-dialog-mobile-nav {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 52px;
  padding: 0 72px;
  background: var(--rk-bg-surface);
}

.settings-dialog-mobile-back {
  position: absolute;
  top: 50%;
  left: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--rk-text-primary);
  cursor: pointer;
  border-radius: 50%;
  outline: none;
  transform: translateY(-50%);
  -webkit-tap-highlight-color: transparent;
}

.settings-dialog-mobile-back:active {
  opacity: 0.72;
}

.settings-dialog-mobile-back-icon {
  transform: rotate(90deg);
}

.settings-dialog-mobile-title {
  margin: 0;
  overflow: hidden;
  font-size: 17px;
  font-weight: 600;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-dialog-mobile-body {
  flex: 1;
  min-height: 0;
  padding: 12px 16px calc(16px + env(safe-area-inset-bottom));
  overflow: hidden auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.settings-dialog-mobile-body::-webkit-scrollbar {
  display: none;
}

.settings-dialog-mobile-group {
  padding: 0 16px;
  margin: 4px 0 8px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--rk-text-tertiary);
}

.settings-dialog-mobile-section {
  margin: 0 0 20px;
  overflow: hidden;
  background: var(--rk-bg-surface);
  border-radius: 12px;
}

.settings-dialog-mobile-row {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 56px;
  padding: 10px 16px;
  outline: none;
}

.settings-dialog-mobile-row + .settings-dialog-mobile-row::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 16px;
  content: '';
  border-top: 0.5px solid var(--rk-border);
}

.settings-dialog-mobile-row.is-pickable {
  cursor: pointer;
  transition: background 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}

.settings-dialog-mobile-row.is-pickable:active {
  background: var(--rk-bg-hover);
}

.settings-dialog-mobile-row.is-disabled .settings-dialog-mobile-text {
  opacity: 0.5;
}

.settings-dialog-mobile-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.settings-dialog-mobile-label {
  font-size: 16px;
  line-height: 1.4;
  color: var(--rk-text-primary);
}

.settings-dialog-mobile-desc {
  font-size: 13px;
  line-height: 1.4;
  color: var(--rk-text-tertiary);
}

.settings-dialog-mobile-value {
  max-width: 50%;
  margin-left: auto;
  overflow: hidden;
  font-size: 16px;
  color: var(--rk-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-dialog-mobile-arrow {
  flex-shrink: 0;
  color: var(--rk-text-tertiary);
  transform: rotate(-90deg);
}

.settings-dialog-mobile-check {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--rk-brand);
}

@media (prefers-reduced-motion: reduce) {
  .settings-dialog-mobile,
  .settings-dialog-mobile.is-open,
  .settings-dialog-mobile-page,
  .settings-dialog-mobile.is-sub .settings-dialog-mobile-root,
  .settings-dialog-mobile-sub,
  .settings-dialog-mobile.is-sub .settings-dialog-mobile-sub {
    transform: none;
  }

  .settings-dialog-mobile,
  .settings-dialog-mobile-sub {
    opacity: 0;
    transition: opacity 0.2s ease, visibility 0s linear 0.2s;
  }

  .settings-dialog-mobile.is-open,
  .settings-dialog-mobile.is-sub .settings-dialog-mobile-sub {
    opacity: 1;
    transition: opacity 0.2s ease, visibility 0s;
  }
}
</style>
