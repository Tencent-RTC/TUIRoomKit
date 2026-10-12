<template>
  <div class="beauty-settings" :class="{ 'is-en': isEnglish }" role="tabpanel">
    <div class="beauty-settings-header">
      <span class="beauty-settings-title">{{ t('Beauty.Title') }}</span>
      <span class="beauty-settings-actions">
        <button
          class="beauty-settings-reset"
          type="button"
          :disabled="!enabled"
          :aria-label="t('Beauty.Reset')"
          :title="t('Beauty.Reset')"
          @click="reset"
        >
          <IconReset :size="16" />
        </button>
        <TUISwitch
          :model-value="enabled"
          size="sm"
          :aria-label="t('Beauty.Title')"
          @change="toggle"
        />
      </span>
    </div>

    <div class="beauty-settings-grid">
      <div
        v-for="row in rows"
        :key="row.key"
        class="beauty-settings-row"
        :class="{ 'is-disabled': !enabled }"
      >
        <span class="beauty-settings-name">{{ t(row.labelKey) }}</span>
        <span class="beauty-settings-controls">
          <TUISlider
            :model-value="draft[row.key]"
            :min="0"
            :max="100"
            :step="1"
            :disabled="!enabled"
            @update:model-value="value => updateLevel(row.key, value)"
          />
          <span class="beauty-settings-value">{{ draft[row.key] }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useFreeBeautyState } from 'tuikit-atomicx-vue3/room';
import { IconReset, TUISlider, TUISwitch, TUIToast, useI18n } from '../../../base';
import { t } from '../../../i18n';
import {
  isBeautyEnabled,
  normalizeBeautyLevels,
  ZERO_BEAUTY,
} from './beauty';
import type { BeautyLevels } from './beauty';

defineOptions({ name: 'BeautySettings' });

const props = withDefaults(defineProps<{
  previewReady?: boolean;
}>(), {
  previewReady: true,
});

const { language } = useI18n();
const { beautyConfig, setFreeBeauty, saveBeautySetting } = useFreeBeautyState();
const isEnglish = computed(() => language.value.toLowerCase().startsWith('en'));

const enabled = ref(false);
const draft = reactive<BeautyLevels>({ ...ZERO_BEAUTY });
const didPreview = ref(false);

const rows: Array<{ key: keyof BeautyLevels; labelKey: string }> = [
  { key: 'beautyLevel', labelKey: 'Beauty.Smooth' },
  { key: 'whitenessLevel', labelKey: 'Beauty.Whitening' },
  { key: 'ruddinessLevel', labelKey: 'Beauty.Ruddy' },
];

let applyTimer: ReturnType<typeof setTimeout> | undefined;

function snapshot(): BeautyLevels {
  return {
    beautyLevel: draft.beautyLevel,
    whitenessLevel: draft.whitenessLevel,
    ruddinessLevel: draft.ruddinessLevel,
  };
}

function restore() {
  const levels = normalizeBeautyLevels(beautyConfig.value);
  draft.beautyLevel = levels.beautyLevel;
  draft.whitenessLevel = levels.whitenessLevel;
  draft.ruddinessLevel = levels.ruddinessLevel;
  enabled.value = isBeautyEnabled(levels);
}

async function commit(levels: BeautyLevels) {
  await setFreeBeauty(levels);
  // setFreeBeauty only drives enableTestBeautyStyle (camera-test preview).
  // saveBeautySetting calls setBeautyStyle on the published conference stream.
  await saveBeautySetting();
  // saveBeautySetting clears the AtomicX cache; refill it so a later camera-on
  // watch reapplies these levels instead of zeros.
  await setFreeBeauty(levels);
  didPreview.value = true;
}

async function preview(levels: BeautyLevels) {
  try {
    await commit(levels);
  } catch {
    TUIToast.error(t('Beauty.ApplyFailed'));
  }
}

function schedulePreview(levels: BeautyLevels) {
  if (applyTimer) {
    clearTimeout(applyTimer);
  }
  applyTimer = setTimeout(() => {
    void preview(levels);
  }, 300);
}

function updateLevel(key: keyof BeautyLevels, value: number) {
  draft[key] = value;
  if (!enabled.value) {
    return;
  }
  schedulePreview(snapshot());
}

function toggle(next: boolean) {
  enabled.value = next;
  void preview(next ? snapshot() : ZERO_BEAUTY);
}

function reset() {
  if (!enabled.value) {
    return;
  }
  draft.beautyLevel = 0;
  draft.whitenessLevel = 0;
  draft.ruddinessLevel = 0;
  void preview(ZERO_BEAUTY);
}

onMounted(() => {
  restore();
  if (enabled.value && props.previewReady) {
    void preview(snapshot());
  }
});

watch(() => props.previewReady, (ready) => {
  if (ready && enabled.value) {
    void preview(snapshot());
  }
});

onUnmounted(() => {
  if (applyTimer) {
    clearTimeout(applyTimer);
  }
  if (!didPreview.value && !enabled.value) {
    return;
  }
  const levels = enabled.value ? snapshot() : ZERO_BEAUTY;
  void commit(levels).catch(() => {
    TUIToast.error(t('Beauty.ApplyFailed'));
  });
});
</script>

<style scoped lang="scss">
.beauty-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.beauty-settings-title {
  font-size: 14px;
  color: var(--rk-text-primary);
}

.beauty-settings-actions {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.beauty-settings-reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.beauty-settings-reset:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.beauty-settings-reset:hover:not(:disabled) {
  color: var(--rk-text-primary);
  background: var(--rk-bg-muted);
}

.beauty-settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 28px;
}

.beauty-settings-row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 8px 0;
}

.beauty-settings-row.is-disabled {
  pointer-events: none;
  opacity: 0.4;
}

.beauty-settings-name {
  flex-shrink: 0;
  min-width: 36px;
  font-size: 13px;
  color: var(--rk-text-secondary);
  white-space: nowrap;
}

/* English copy is uneven (Rosy / Smooth / Whitening). Pin one column so sliders share a start edge. */
.beauty-settings.is-en .beauty-settings-name {
  width: 72px;
}

.beauty-settings-controls {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.beauty-settings-controls :deep(.rk-slider) {
  flex: 1;
  min-width: 0;
}

.beauty-settings-value {
  min-width: 20px;
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-tertiary);
  text-align: right;
}

@media (width <= 520px) {
  .beauty-settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
