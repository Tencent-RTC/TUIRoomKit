<template>
  <TUIPopup
    :open="open"
    :height="sheetHeight"
    :closable="false"
    @close="emit('close')"
  >
    <template #header>
      <button
        v-if="pickerType"
        class="caption-settings-back"
        type="button"
        :aria-label="t('AITools.Back')"
        @click="pickerType = undefined"
      >
        <IconArrowRight :size="16" />
      </button>
      <div class="caption-settings-title">
        {{ headTitle }}
      </div>
    </template>
    <div class="caption-settings-mobile">
      <div v-if="pickerType" class="caption-settings-langs">
        <button
          v-for="option in pickerOptions"
          :key="option.value"
          class="caption-settings-lang"
          type="button"
          :class="{ 'is-selected': option.value === pickerValue }"
          @click="applyPickedLanguage(option.value)"
        >
          <span>{{ option.label }}</span>
          <IconCheck v-if="option.value === pickerValue" :size="16" />
        </button>
      </div>
      <template v-else>
        <div v-if="canManageASR" class="caption-settings-row">
          <span>{{ t('AITools.H5ShowFloating') }}</span>
          <TUISwitch
            :model-value="captionsOn"
            :disabled="!asrOn"
            size="lg"
            @change="toggleCaptions"
          />
        </div>
        <button
          v-if="canManageASR"
          class="caption-settings-row is-nav"
          type="button"
          @click="openPicker('source')"
        >
          <span>{{ t('AITools.SourceLanguage') }}</span>
          <span class="caption-settings-value">
            {{ sourceLanguageLabel }}
            <IconChevronRightMobile :size="12" />
          </span>
        </button>
        <div class="caption-settings-row">
          <span>{{ t('AITools.SubtitleModeSwitchLabel') }}</span>
          <span v-if="isTransNone" class="caption-settings-hint">{{ transNoneHint }}</span>
          <TUISwitch v-else v-model="showTrans" size="lg" />
        </div>
        <button
          v-if="canManageASR"
          class="caption-settings-row is-nav"
          :class="{ 'is-dimmed': !showTrans }"
          type="button"
          :disabled="!showTrans"
          @click="openPicker('target')"
        >
          <span>{{ t('AITools.TargetLanguage') }}</span>
          <span class="caption-settings-value">
            {{ targetLanguageLabel }}
            <IconChevronRightMobile :size="12" />
          </span>
        </button>
      </template>
    </div>
  </TUIPopup>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { IconArrowRight, IconCheck, IconChevronRightMobile, TUIPopup, TUISwitch, t } from '../../../base';
import { useASRState } from '../useASRState';
import { useSubtitleViewState } from '../useSubtitleViewState';
import { useSubtitleSettings } from './useSubtitleSettings';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { asrOn, isTransNone, canManageASR } = useASRState();
const { capViewOpen, presentCaptionHint, hideCaptionOverlay, showTrans } = useSubtitleViewState();
const {
  pickerType,
  sourceLanguageLabel,
  targetLanguageLabel,
  transNoneHint,
  pickerValue,
  pickerOptions,
  applyPickedLanguage,
  openPicker,
} = useSubtitleSettings();

const sheetHeight = computed(() => (canManageASR.value ? '60%' : 'auto'));
const captionsOn = computed(() => asrOn.value && capViewOpen.value);
const headTitle = computed(() => {
  if (pickerType.value === 'source') {
    return t('AITools.SelectSourceLanguage');
  }
  if (pickerType.value === 'target') {
    return t('AITools.SelectTargetLanguage');
  }
  return t('AITools.SettingsTitle');
});

watch(() => props.open, (open) => {
  if (open) {
    pickerType.value = undefined;
  }
});

function toggleCaptions(next: boolean) {
  if (!asrOn.value) {
    return;
  }
  if (next) {
    presentCaptionHint();
    return;
  }
  hideCaptionOverlay();
}
</script>

<style scoped lang="scss">
.caption-settings-mobile {
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
}

.caption-settings-back {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: transparent;
  border: 0;
  transform: rotate(180deg);
}

.caption-settings-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: var(--rk-fs-lg);
  font-weight: 600;
  line-height: 20px;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.caption-settings-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 0;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-primary);
  text-align: left;
  background: transparent;
  border: 0;
}

.caption-settings-row.is-nav {
  cursor: pointer;
}

.caption-settings-row.is-dimmed {
  opacity: 0.4;
}

.caption-settings-value {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: var(--rk-fs-sm);
  color: var(--rk-text-tertiary);
}

.caption-settings-hint {
  font-size: var(--rk-fs-sm);
  color: var(--rk-text-tertiary);
}

.caption-settings-mobile :deep(.rk-switch.rk-switch-lg) {
  width: 44px;
  height: 26px;
  padding: 3px;
}

.caption-settings-mobile :deep(.rk-switch-lg .rk-switch-thumb) {
  width: 20px;
  height: 20px;
}

.caption-settings-mobile :deep(.rk-switch-on.rk-switch-lg .rk-switch-thumb) {
  transform: translateX(18px);
}

.caption-settings-langs {
  display: flex;
  flex-direction: column;
}

.caption-settings-lang {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 2px;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-primary);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.caption-settings-lang.is-selected {
  color: var(--rk-brand);
}
</style>
