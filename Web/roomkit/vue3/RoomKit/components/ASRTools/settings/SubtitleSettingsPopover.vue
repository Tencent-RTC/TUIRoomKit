<template>
  <div
    data-asr-flyout-host
    :class="[
      'cap-settings',
      host === 'panel' ? 'cap-settings--panel' : ['cap-settings--icon', `cap-settings--${placement}`],
      { 'cap-settings--picking': Boolean(pickerType) },
    ]"
    @pointerdown.stop
    @click.stop
    @touchend.stop
  >
    <template v-if="pickerType">
      <div class="cap-settings__picker-head">
        <button
          class="cap-settings__back"
          type="button"
          :data-tooltip="t('AITools.Back')"
          :aria-label="t('AITools.Back')"
          @click="pickerType = undefined"
        >
          <IconChevronLeft :size="16" />
        </button>
        <span class="cap-settings__picker-title">{{ pickerTitle }}</span>
      </div>
      <div class="cap-settings__picker-list">
        <button
          v-for="option in pickerOptions"
          :key="option.value || 'none'"
          class="cap-settings__picker-item"
          type="button"
          :class="{ 'is-selected': option.value === pickerValue }"
          @click="applyPickedLanguage(option.value)"
        >
          <span class="cap-settings__picker-label">{{ option.label }}</span>
          <IconCheck v-if="option.value === pickerValue" :size="14" />
        </button>
      </div>
    </template>

    <template v-else>
      <template v-if="canManageASR">
        <div class="cap-settings__title">
          {{ t('AITools.GroupTranscription') }}
        </div>
        <div
          class="cap-settings__row"
          :class="{ 'is-navigable': isPanel }"
          @click="openPicker('source')"
        >
          <span class="cap-settings__label">{{ t('AITools.SourceLanguage') }}</span>
          <!-- The dock is short; a dropdown would bury the remaining rows. -->
          <LanguageSelect
            v-if="!isPanel"
            :model-value="sourceLanguage"
            :options="sourceLanguageOptions"
            placement="side"
            @update:model-value="applySourceLanguage"
          />
          <span v-else class="cap-settings__value">
            <span class="cap-settings__value-text">{{ sourceLanguageLabel }}</span>
            <IconChevronRight :size="12" />
          </span>
        </div>

        <div class="cap-settings__separator" />
      </template>

      <div class="cap-settings__title">
        {{ t('AITools.GroupTranslation') }}
      </div>
      <div class="cap-settings__row">
        <span class="cap-settings__label">{{ t('AITools.SubtitleModeSwitchLabel') }}</span>
        <!-- Without a translation language there is no second line to toggle. -->
        <span v-if="isTransNone" class="cap-settings__hint">{{ transNoneHint }}</span>
        <TUISwitch v-else v-model="showTrans" />
      </div>
      <div
        v-if="canManageASR"
        class="cap-settings__row"
        :class="{ 'is-navigable': isPanel }"
        @click="openPicker('target')"
      >
        <span class="cap-settings__label">{{ t('AITools.TargetLanguage') }}</span>
        <LanguageSelect
          v-if="!isPanel"
          :model-value="targetLanguage"
          :options="targetLanguageOptions"
          placement="side"
          @update:model-value="applyTargetLanguage"
        />
        <span v-else class="cap-settings__value">
          <span class="cap-settings__value-text">{{ targetLanguageLabel }}</span>
          <IconChevronRight :size="12" />
        </span>
      </div>

      <template v-if="showCaptionGroup">
        <div class="cap-settings__separator" />

        <div class="cap-settings__title">
          {{ t('AITools.GroupSubtitle') }}
        </div>
        <div class="cap-settings__row">
          <span class="cap-settings__label">{{ t('AITools.FontSize') }}</span>
          <div class="cap-settings__sizes">
            <button
              v-for="option in fontSizeOptions"
              :key="option.value"
              class="cap-settings__size"
              type="button"
              :class="{ 'is-active': fontSize === option.value }"
              @click="fontSize = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  TUISwitch,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import LanguageSelect from './LanguageSelect.vue';
import { useSubtitleSettings } from './useSubtitleSettings';
import type { SubtitleSettingsPickerType } from './useSubtitleSettings';

const props = withDefaults(defineProps<{
  /** Which side of the caption gear has room for the popover. */
  placement?: 'top' | 'bottom';
  /** Caption dock includes font size; the record panel omits that group. */
  showCaptionGroup?: boolean;
  /** `panel` anchors below a record-toolbar control; `dock` beside the caption gear. */
  host?: 'dock' | 'panel';
}>(), {
  placement: 'top',
  showCaptionGroup: true,
  host: 'dock',
});

const { t } = useUIKit();
const {
  sourceLanguage,
  targetLanguage,
  isTransNone,
  canManageASR,
  showTrans,
  fontSize,
  pickerType,
  sourceLanguageOptions,
  targetLanguageOptions,
  sourceLanguageLabel,
  targetLanguageLabel,
  fontSizeOptions,
  transNoneHint,
  pickerValue,
  pickerOptions,
  applySourceLanguage,
  applyTargetLanguage,
  applyPickedLanguage,
  openPicker: openSettingsPicker,
} = useSubtitleSettings();

const isPanel = computed(() => props.host === 'panel');

const pickerTitle = computed(() => (
  pickerType.value === 'source'
    ? t('AITools.SourceLanguage')
    : t('AITools.TargetLanguage')
));

function openPicker(type: SubtitleSettingsPickerType) {
  // The record panel drills in; the caption dock keeps a side flyout.
  if (!isPanel.value) {
    return;
  }
  openSettingsPicker(type);
}
</script>

<style lang="scss" scoped>
@import '../styles/asrTooltip';

.cap-settings {
  position: absolute;
  right: 8px;
  z-index: 3;
  box-sizing: border-box;
  width: 320px;
  padding: 8px;
  background: var(--bg-color-operate);
  border: 1px solid var(--stroke-color-primary);
  border-radius: 12px;
  // Dual layer: a tight contact edge plus a wider ambient drop so the card
  // lifts off the same-color record panel. `--uikit-color-black-16` is not a
  // theme token, so the previous single shadow painted nothing.
  box-shadow:
    0 1px 2px var(--uikit-color-black-7),
    0 8px 28px var(--uikit-color-black-6);
  cursor: default;
}

.cap-settings--icon,
.cap-settings--panel {
  right: 0;
  width: min(320px, calc(100vw - 32px));
}

.cap-settings--icon.cap-settings--bottom,
.cap-settings--panel {
  top: calc(100% + 8px);
  bottom: auto;
}

.cap-settings--icon.cap-settings--top {
  top: auto;
  bottom: calc(100% + 2px);
}

.cap-settings--picking {
  display: flex;
  flex-direction: column;
  max-height: min(420px, calc(100vh - 120px));
  padding: 6px;
}

.cap-settings__title {
  padding: 6px 8px;
  color: var(--text-color-secondary);
  font-size: 12px;
}

.cap-settings__row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding: 4px 8px;
  border-radius: 6px;

  &.is-navigable {
    cursor: pointer;

    &:hover {
      background: var(--button-color-secondary-hover);
    }
  }
}

.cap-settings__label {
  flex: none;
  color: var(--text-color-primary);
  font-size: 13px;
  white-space: nowrap;
}

.cap-settings__value {
  display: flex;
  flex: 1;
  gap: 4px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  color: var(--text-color-secondary);
  font-size: 13px;
}

.cap-settings__value-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cap-settings__hint {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--text-color-secondary);
  font-size: 12px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cap-settings__separator {
  height: 1px;
  margin: 4px;
  background: var(--stroke-color-primary);
}

.cap-settings__sizes {
  display: flex;
  gap: 4px;
}

.cap-settings__size {
  height: 28px;
  padding: 0 10px;
  color: var(--text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--stroke-color-primary);
  border-radius: 6px;

  &.is-active {
    color: var(--text-color-button);
    background: var(--button-color-primary-default);
    border-color: var(--button-color-primary-default);
  }
}

.cap-settings__picker-head {
  display: flex;
  flex: none;
  gap: 4px;
  align-items: center;
  min-height: 36px;
  padding: 0 2px 4px;
}

.cap-settings__back {
  position: relative;
  @include asr-tooltip;

  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--text-color-primary);
  cursor: pointer;
  appearance: none;
  background: transparent;
  border: none;
  border-radius: 6px;

  &:hover {
    background: var(--button-color-secondary-hover);
  }
}

.cap-settings__picker-title {
  min-width: 0;
  overflow: hidden;
  color: var(--text-color-primary);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cap-settings__picker-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--stroke-color-secondary) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--stroke-color-secondary);
    border-radius: 3px;
  }
}

.cap-settings__picker-item {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  color: var(--text-color-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;

  &:hover {
    background: var(--button-color-secondary-hover);
  }

  &.is-selected {
    color: var(--text-color-link);
    font-weight: 600;
  }
}

.cap-settings__picker-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
