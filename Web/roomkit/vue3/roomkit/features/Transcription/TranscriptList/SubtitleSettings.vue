<template>
  <div
    class="cap-settings"
    :class="[
      host === 'panel' ? 'cap-settings-panel' : '',
      host === 'dock' ? ['cap-settings-icon', placement === 'bottom' ? 'cap-settings-bottom' : 'cap-settings-top'] : '',
      { 'cap-settings-picking': Boolean(pickerType) },
    ]"
    @pointerdown.stop
    @click.stop
  >
    <template v-if="pickerType">
      <div class="cap-settings-picker-head">
        <button
          class="cap-settings-back"
          type="button"
          :aria-label="t('AITools.Back')"
          @click="pickerType = undefined"
        >
          <IconArrowRight class="cap-settings-back-icon" :size="16" />
        </button>
        <span class="cap-settings-picker-title">{{ pickerTitle }}</span>
      </div>
      <div class="cap-settings-picker-list">
        <button
          v-for="option in pickerOptions"
          :key="option.value"
          class="cap-settings-picker-item"
          type="button"
          :class="{ 'is-selected': option.value === pickerValue }"
          @click="applyPickedLanguage(option.value)"
        >
          <span class="cap-settings-picker-label">{{ option.label }}</span>
          <IconCheck v-if="option.value === pickerValue" :size="14" />
        </button>
      </div>
    </template>

    <template v-else>
      <template v-if="canManageASR">
        <div class="cap-settings-title">
          {{ t('AITools.GroupTranscription') }}
        </div>
        <button
          class="cap-settings-row is-navigable"
          type="button"
          @click="openPicker('source')"
        >
          <span class="cap-settings-label">{{ t('AITools.SourceLanguage') }}</span>
          <span class="cap-settings-value">
            <span class="cap-settings-value-text">{{ sourceLanguageLabel }}</span>
            <IconArrowRight :size="12" />
          </span>
        </button>
        <div class="cap-settings-separator" />
      </template>

      <div class="cap-settings-title">
        {{ t('AITools.GroupTranslation') }}
      </div>
      <div class="cap-settings-row is-toggle">
        <span class="cap-settings-label">{{ t('AITools.SubtitleModeSwitchLabel') }}</span>
        <span v-if="isTransNone" class="cap-settings-hint">{{ transNoneHint }}</span>
        <TUISwitch v-else v-model="showTrans" size="sm" />
      </div>
      <button
        v-if="canManageASR"
        class="cap-settings-row is-navigable"
        :class="{ 'is-dimmed': !showTrans }"
        type="button"
        @click="openPicker('target')"
      >
        <span class="cap-settings-label">{{ t('AITools.TargetLanguage') }}</span>
        <span class="cap-settings-value">
          <span class="cap-settings-value-text">{{ targetLanguageLabel }}</span>
          <IconArrowRight :size="12" />
        </span>
      </button>

      <div class="cap-settings-separator" />
      <div class="cap-settings-title">
        {{ t('AITools.GroupSubtitle') }}
      </div>
      <div class="cap-settings-row">
        <span class="cap-settings-label">{{ t('AITools.FontSize') }}</span>
        <div class="cap-settings-sizes">
          <button
            v-for="option in fontSizeOptions"
            :key="option.value"
            class="cap-settings-size"
            type="button"
            :class="{ 'is-active': fontSize === option.value }"
            @click="fontSize = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { IconArrowRight, IconCheck, TUISwitch, t } from '../../../base';
import { useASRState } from '../useASRState';
import { useSubtitleViewState } from '../useSubtitleViewState';
import { useSubtitleSettings } from './useSubtitleSettings';

withDefaults(defineProps<{
  placement?: 'top' | 'bottom';
  host?: 'dock' | 'panel';
}>(), {
  placement: 'top',
  host: 'dock',
});

const { isTransNone, canManageASR } = useASRState();
const { showTrans, fontSize } = useSubtitleViewState();
const {
  pickerType,
  sourceLanguageLabel,
  targetLanguageLabel,
  fontSizeOptions,
  transNoneHint,
  pickerValue,
  pickerOptions,
  applyPickedLanguage,
  openPicker,
} = useSubtitleSettings();

const pickerTitle = computed(() => (
  pickerType.value === 'source'
    ? t('AITools.SourceLanguage')
    : t('AITools.TargetLanguage')
));
</script>

<style scoped lang="scss">
.cap-settings {
  position: absolute;
  z-index: 3;
  box-sizing: border-box;
  width: 280px;
  max-width: calc(100vw - 32px);
  min-width: 260px;
  padding: 8px;
  color: var(--rk-text-primary);
  font-size: var(--rk-fs-md);
  text-align: left;
  cursor: default;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border-strong);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgb(0 0 0 / 16%);
  backdrop-filter: blur(24px);
  animation: cap-settings-in 0.18s ease-out;
}

.cap-settings-icon.cap-settings-bottom,
.cap-settings-panel {
  top: calc(100% + 8px);
  right: 0;
}

.cap-settings-icon.cap-settings-top {
  right: 0;
  bottom: calc(100% + 8px);
  animation-name: cap-settings-in-up;
}

.cap-settings-picking {
  display: flex;
  flex-direction: column;
  max-height: min(420px, calc(100vh - 120px));
}

.cap-settings-title {
  padding: 8px 12px 4px;
  color: var(--rk-text-tertiary);
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cap-settings-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 7px 12px;
  color: inherit;
  font-family: inherit;
  font-size: var(--rk-fs-md);
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 10px;
}

.cap-settings-row.is-toggle {
  padding: 10px 12px;
}

.cap-settings-row.is-navigable {
  cursor: pointer;
}

.cap-settings-row.is-navigable:hover {
  background: var(--rk-bg-hover);
}

.cap-settings-row.is-dimmed {
  opacity: 0.42;
  pointer-events: none;
}

.cap-settings-label {
  flex: none;
  color: var(--rk-text-primary);
  font-size: var(--rk-fs-md);
  white-space: nowrap;
}

.cap-settings-value {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  color: var(--rk-text-tertiary);
  font-size: var(--rk-fs-sm);
}

.cap-settings-value :deep(svg) {
  flex: none;
  opacity: 0.8;
}

.cap-settings-value-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cap-settings-hint {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--rk-text-secondary);
  font-size: var(--rk-fs-sm);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cap-settings-separator {
  height: 1px;
  margin: 6px 8px;
  background: var(--rk-border);
}

.cap-settings-sizes {
  display: flex;
  flex: none;
  gap: 5px;
}

.cap-settings-size {
  height: 28px;
  padding: 0 10px;
  color: var(--rk-text-secondary);
  font-family: inherit;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  cursor: pointer;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
}

.cap-settings-size:hover {
  background: var(--rk-bg-hover);
}

.cap-settings-size.is-active {
  color: var(--rk-text-primary);
  font-weight: 600;
  background: var(--rk-brand-soft);
  border-color: var(--rk-brand);
}

.cap-settings :deep(.rk-switch-sm) {
  width: 24px;
  height: 14px;
  padding: 1px;
}

.cap-settings :deep(.rk-switch-sm .rk-switch-thumb) {
  width: 12px;
  height: 12px;
}

.cap-settings :deep(.rk-switch-on.rk-switch-sm .rk-switch-thumb) {
  transform: translateX(10px);
}

.cap-settings-picker-head {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
  padding: 0 0 2px;
}

.cap-settings-back {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 10px;
}

.cap-settings-back:hover {
  background: var(--rk-bg-hover);
}

.cap-settings-back-icon {
  transform: rotate(180deg);
}

.cap-settings-picker-title {
  min-width: 0;
  overflow: hidden;
  font-size: var(--rk-fs-md);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cap-settings-picker-list {
  flex: 1;
  min-height: 0;
  max-height: 248px;
  margin-top: 2px;
  padding-top: 4px;
  overflow-y: auto;
  border-top: 1px solid var(--rk-border);
}

.cap-settings-picker-item {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 10px;
  color: var(--rk-text-primary);
  font-family: inherit;
  font-size: var(--rk-fs-md);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 10px;
}

.cap-settings-picker-item:hover {
  background: var(--rk-bg-hover);
}

.cap-settings-picker-item.is-selected {
  color: var(--rk-text-primary);
  font-weight: 600;
}

.cap-settings-picker-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes cap-settings-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes cap-settings-in-up {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cap-settings {
    animation: none;
  }
}
</style>
